import mongoose from "mongoose";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import ComprobanteModel, {
  ConsecutivoComprobante,
  TIPOS_COMPROBANTE,
} from "../models/ComprobanteModel.js";
import ComprobanteFirmadoModel from "../models/ComprobanteFirmadoModel.js";
import PacienteModel from "../models/PacienteModel.js";
import { enviarCorreoComprobante } from "./EmailService.js";
import {
  enviarMensajePlantilla,
  normalizarTelefono,
  subirDocumentoWhatsapp,
  telefonoPermitido,
} from "./WhatsappService.js";

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERROR_ENVIO_SEGURO =
  "No fue posible enviar el comprobante por correo.";

const CAMPOS_LISTADO = [
  "numero",
  "paciente_id",
  "paciente_nombre",
  "paciente_cedula",
  "correo_destino",
  "usuario_id",
  "profesional_nombre",
  "tipo",
  "fecha",
  "hora_inicio",
  "hora_fin",
  "descripcion",
  "estado_envio",
  "enviado_a",
  "enviado_en",
  "cantidad_envios",
  "firmado",
  "estado_whatsapp",
  "whatsapp_enviado_a",
  "whatsapp_enviado_en",
  "whatsapp_version_enviada",
  "cantidad_envios_whatsapp",
  "createdAt",
].join(" ");

const crearError = (mensaje, statusCode = 400) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
};

const normalizarCorreo = (correo = "") => {
  return String(correo).trim().toLowerCase();
};

const validarCorreo = (correo) => {
  if (!FORMATO_CORREO.test(correo)) {
    throw crearError("El correo de destino no es válido.");
  }
};

const validarObjectId = (id, mensaje) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw crearError(mensaje);
  }
};

const validarHora = (hora, nombreCampo) => {
  if (hora === undefined || hora === null || hora === "") {
    return "";
  }

  if (typeof hora !== "string") {
    throw crearError(
      `${nombreCampo} debe utilizar el formato HH:mm.`
    );
  }

  const horaNormalizada = hora.trim();

  if (!FORMATO_HORA.test(horaNormalizada)) {
    throw crearError(
      `${nombreCampo} debe utilizar el formato HH:mm.`
    );
  }

  return horaNormalizada;
};

const minutosDesdeMedianoche = (hora) => {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
};

const normalizarFecha = (fecha) => {
  if (!(fecha instanceof Date) && typeof fecha !== "string") {
    throw crearError("La fecha no es válida.");
  }

  if (typeof fecha === "string") {
    const valor = fecha.trim();
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);

    if (coincidencia) {
      const [, anio, mes, dia] = coincidencia;
      const fechaUTC = new Date(
        Date.UTC(Number(anio), Number(mes) - 1, Number(dia))
      );

      if (
        fechaUTC.getUTCFullYear() !== Number(anio) ||
        fechaUTC.getUTCMonth() !== Number(mes) - 1 ||
        fechaUTC.getUTCDate() !== Number(dia)
      ) {
        throw crearError("La fecha no es válida.");
      }

      return fechaUTC;
    }
  }

  const fechaNormalizada = new Date(fecha);

  if (Number.isNaN(fechaNormalizada.getTime())) {
    throw crearError("La fecha no es válida.");
  }

  return fechaNormalizada;
};

const validarDatosComprobante = ({
  paciente_id,
  tipo,
  fecha,
  hora_inicio = "",
  hora_fin = "",
  descripcion,
}) => {
  validarObjectId(paciente_id, "El paciente indicado no es válido.");

  if (!TIPOS_COMPROBANTE.includes(tipo)) {
    throw crearError("El tipo de comprobante no es válido.");
  }

  if (!fecha) {
    throw crearError("La fecha es obligatoria.");
  }

  const fechaNormalizada = normalizarFecha(fecha);

  if (
    typeof descripcion !== "string" ||
    !descripcion.trim()
  ) {
    throw crearError("La descripción es obligatoria.");
  }

  if (descripcion.trim().length > 1500) {
    throw crearError(
      "La descripción no puede superar los 1500 caracteres."
    );
  }

  const horaInicioNormalizada = validarHora(
    hora_inicio,
    "La hora de inicio"
  );
  const horaFinNormalizada = validarHora(
    hora_fin,
    "La hora de finalización"
  );

  if (
    horaInicioNormalizada &&
    horaFinNormalizada &&
    minutosDesdeMedianoche(horaFinNormalizada) <=
      minutosDesdeMedianoche(horaInicioNormalizada)
  ) {
    throw crearError(
      "La hora de finalización debe ser posterior a la hora de inicio."
    );
  }

  return {
    fecha: fechaNormalizada,
    hora_inicio: horaInicioNormalizada,
    hora_fin: horaFinNormalizada,
    descripcion: descripcion.trim(),
  };
};

const generarNumeroComprobante = async (fecha) => {
  const anio = fecha.getUTCFullYear();
  const consecutivo = await ConsecutivoComprobante.findOneAndUpdate(
    { _id: `comprobante-${anio}` },
    { $inc: { valor: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `COMP-${anio}-${String(consecutivo.valor).padStart(6, "0")}`;
};

const escaparRegex = (valor) => {
  return String(valor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const obtenerComprobante = async (id) => {
  validarObjectId(id, "El comprobante indicado no es válido.");

  const comprobante = await ComprobanteModel.findById(id);

  if (!comprobante) {
    throw crearError("El comprobante no existe.", 404);
  }

  return comprobante;
};

const textoSeguroPdf = (valor = "") => {
  return String(valor)
    .replace(/\r/g, "")
    .replace(/[^\x0A\x20-\x7E\xA0-\xFF]/g, "?");
};

const dividirTexto = (texto, fuente, tamano, anchoMaximo) => {
  const lineas = [];
  const parrafos = textoSeguroPdf(texto).split("\n");

  for (const parrafo of parrafos) {
    const palabras = parrafo.split(/\s+/).filter(Boolean);

    if (palabras.length === 0) {
      lineas.push("");
      continue;
    }

    let linea = "";

    for (const palabra of palabras) {
      const candidata = linea ? `${linea} ${palabra}` : palabra;

      if (
        fuente.widthOfTextAtSize(candidata, tamano) <=
        anchoMaximo
      ) {
        linea = candidata;
        continue;
      }

      if (linea) {
        lineas.push(linea);
      }

      linea = palabra;
    }

    if (linea) {
      lineas.push(linea);
    }
  }

  return lineas;
};

const formatearFecha = (fecha) => {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
};

export const listarComprobantesService = async ({
  tipo,
  paciente,
  busqueda,
}) => {
  const filtro = {};

  if (tipo) {
    if (!TIPOS_COMPROBANTE.includes(tipo)) {
      throw crearError("El tipo de comprobante no es válido.");
    }

    filtro.tipo = tipo;
  }

  if (paciente) {
    validarObjectId(
      paciente,
      "El paciente utilizado como filtro no es válido."
    );
    filtro.paciente_id = paciente;
  }

  if (busqueda && String(busqueda).trim()) {
    const expresion = new RegExp(
      escaparRegex(String(busqueda).trim()),
      "i"
    );

    filtro.$or = [
      { numero: expresion },
      { paciente_nombre: expresion },
      { paciente_cedula: expresion },
      { correo_destino: expresion },
      { profesional_nombre: expresion },
    ];
  }

  return ComprobanteModel.find(filtro)
    .select(CAMPOS_LISTADO)
    .sort({ createdAt: -1, fecha: -1 })
    .lean();
};

export const obtenerComprobantePorIdService = async (id) => {
  return obtenerComprobante(id);
};

export const crearComprobanteService = async (
  datos,
  usuarioAutenticado
) => {
  if (!usuarioAutenticado?._id || !usuarioAutenticado?.nombre) {
    throw crearError(
      "No fue posible identificar al profesional autenticado.",
      401
    );
  }

  const {
    paciente_id,
    tipo,
    fecha,
    hora_inicio = "",
    hora_fin = "",
    descripcion,
    correo_destino,
  } = datos;

  const datosValidados = validarDatosComprobante({
    paciente_id,
    tipo,
    fecha,
    hora_inicio,
    hora_fin,
    descripcion,
  });

  const paciente = await PacienteModel.findById(paciente_id);

  if (!paciente) {
    throw crearError("El paciente indicado no existe.", 404);
  }

  if (paciente.activo === false) {
    throw crearError(
      "No se puede crear un comprobante para un paciente inactivo."
    );
  }

  if (!paciente.nombre || !paciente.nombre.trim()) {
    throw crearError(
      "El paciente no tiene un nombre disponible para el comprobante."
    );
  }

  const correoSolicitado =
    correo_destino === undefined || correo_destino === null
      ? paciente.correo
      : correo_destino;
  let correoDestino = normalizarCorreo(correoSolicitado);

  // Al crear, el correo es opcional: si no es válido, se guarda vacío
  if (correoDestino && !FORMATO_CORREO.test(correoDestino)) {
    correoDestino = "";
  }

  const numero = await generarNumeroComprobante(
    datosValidados.fecha
  );

  return ComprobanteModel.create({
    numero,
    paciente_id: paciente._id,
    paciente_nombre: paciente.nombre,
    paciente_cedula: paciente.cedula || "",
    correo_destino: correoDestino,
    usuario_id: usuarioAutenticado._id,
    profesional_nombre: usuarioAutenticado.nombre,
    tipo,
    fecha: datosValidados.fecha,
    hora_inicio: datosValidados.hora_inicio,
    hora_fin: datosValidados.hora_fin,
    descripcion: datosValidados.descripcion,
    estado_envio: "pendiente",
  });
};

/* ───────── PDF del comprobante (mismo estilo que la documentación de la clínica) ───────── */

const CLINICA = {
  nombre: "ARMONÍA DENTAL",
  telefono: "6111-9106",
  correo: "lau_ure@icloud.com",
};

const COLOR = {
  azul: rgb(0x2a / 255, 0x4d / 255, 0x84 / 255), // #2a4d84
  naranja: rgb(0xf1 / 255, 0x97 / 255, 0x2d / 255), // #f1972d
  celeste: rgb(0xf4 / 255, 0xf7 / 255, 0xfb / 255), // #f4f7fb
  borde: rgb(0xd9 / 255, 0xe1 / 255, 0xec / 255), // #d9e1ec
  texto: rgb(0.12, 0.14, 0.18),
  gris: rgb(0.42, 0.46, 0.52),
};

// El logo se lee una sola vez y se reutiliza en cada PDF
let logoCache;
const leerLogo = async () => {
  if (logoCache === undefined) {
    try {
      logoCache = await readFile(new URL("../assets/logo-armonia-dental.png", import.meta.url));
    } catch (error) {
      console.error("No se encontró el logo para el comprobante:", error.message);
      logoCache = null; // el PDF se genera igual, sin logo
    }
  }
  return logoCache;
};

export const generarPdfComprobanteService = async (comprobanteOId) => {
  const comprobante =
    typeof comprobanteOId === "string"
      ? await obtenerComprobante(comprobanteOId)
      : comprobanteOId;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Comprobante ${comprobante.numero}`);
  pdf.setAuthor("Armonía Dental");
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bytesLogo = await leerLogo();
  const logo = bytesLogo ? await pdf.embedPng(bytesLogo) : null;

  const ANCHO = 612;
  const ALTO = 792;
  const MARGEN = 56;
  const CONTENIDO = ANCHO - MARGEN * 2;
  const PIE = 64; // espacio reservado para el pie de página
  let pagina;
  let y;

  const texto = (valor, { x, size = 10.5, fuente = normal, color = COLOR.texto, alinear = "izquierda", ancho = 0 }) => {
    const t = textoSeguroPdf(valor);
    const w = fuente.widthOfTextAtSize(t, size);
    const xFinal = alinear === "derecha" ? x - w : alinear === "centro" ? x + (ancho - w) / 2 : x;
    pagina.drawText(t, { x: xFinal, y, size, font: fuente, color });
  };

  const encabezado = () => {
    pagina = pdf.addPage([ANCHO, ALTO]);
    const tope = ALTO - 44;

    if (logo) {
      const alto = 64;
      const ancho = (logo.width / logo.height) * alto;
      pagina.drawImage(logo, { x: MARGEN, y: tope - alto, width: ancho, height: alto });
    }

    y = tope - 20;
    texto(CLINICA.nombre, { x: ANCHO - MARGEN, size: 15, fuente: negrita, color: COLOR.azul, alinear: "derecha" });
    y -= 16;
    texto("COMPROBANTE MÉDICO", { x: ANCHO - MARGEN, size: 7.5, fuente: negrita, color: COLOR.gris, alinear: "derecha" });
    y -= 13;
    texto(`Tel. ${CLINICA.telefono}  ·  ${CLINICA.correo}`, { x: ANCHO - MARGEN, size: 8, color: COLOR.gris, alinear: "derecha" });

    y = tope - 64 - 14;
    pagina.drawLine({ start: { x: MARGEN, y }, end: { x: ANCHO - MARGEN, y }, thickness: 1.4, color: COLOR.azul });
    y -= 22;
  };

  const asegurarEspacio = (alto) => {
    if (y - alto < MARGEN + PIE - 20) encabezado();
  };

  // ── Primera página: encabezado, tipo y título ──
  encabezado();
  texto(String(comprobante.tipo || "").toUpperCase(), { x: MARGEN, size: 7.5, fuente: negrita, color: COLOR.naranja });
  y -= 22;
  texto("Comprobante de atención odontológica", { x: MARGEN, size: 19, fuente: negrita, color: COLOR.azul });
  y -= 18;
  texto(`N.º ${comprobante.numero}`, { x: MARGEN, size: 10, color: COLOR.gris });
  y -= 22;

  // ── Datos en recuadro celeste (dos columnas, como la carta) ──
  const horario =
    comprobante.hora_inicio || comprobante.hora_fin
      ? `${comprobante.hora_inicio || "--:--"} a ${comprobante.hora_fin || "--:--"}`
      : "No indicado";
  const filas = [
    [["PACIENTE", comprobante.paciente_nombre], ["CÉDULA", comprobante.paciente_cedula || "No indicada"]],
    [["FECHA DE ATENCIÓN", formatearFecha(comprobante.fecha)], ["HORARIO", horario]],
    [["PROFESIONAL", comprobante.profesional_nombre], ["TIPO DE COMPROBANTE", comprobante.tipo]],
  ];
  // Cada valor puede ocupar varias líneas (ej. un nombre largo); la fila crece en lugar de recortarlo
  const columna = CONTENIDO / 2;
  const anchoValor = columna - 28;
  const celdas = filas.map((fila) =>
    fila.map(([etiqueta, valor]) => [etiqueta, dividirTexto(valor || "No indicado", normal, 10.5, anchoValor)])
  );
  const altos = celdas.map((fila) => 30 + (Math.max(...fila.map(([, l]) => l.length)) - 1) * 13 + 12);
  const altoTabla = altos.reduce((a, b) => a + b, 0);
  pagina.drawRectangle({ x: MARGEN, y: y - altoTabla, width: CONTENIDO, height: altoTabla, color: COLOR.celeste });
  let base = y;
  celdas.forEach((fila, i) => {
    if (i > 0) {
      pagina.drawLine({ start: { x: MARGEN, y: base }, end: { x: MARGEN + CONTENIDO, y: base }, thickness: 0.8, color: COLOR.borde });
    }
    fila.forEach(([etiqueta, lineas], j) => {
      const x = MARGEN + 14 + j * columna;
      y = base - 15;
      texto(etiqueta, { x, size: 7, fuente: negrita, color: COLOR.azul });
      lineas.forEach((linea, k) => {
        y = base - 30 - k * 13;
        texto(linea, { x, size: 10.5 });
      });
    });
    base -= altos[i];
  });
  y = base - 26;

  // ── Descripción ──
  texto("Descripción", { x: MARGEN, size: 11, fuente: negrita, color: COLOR.azul });
  y -= 18;
  for (const linea of dividirTexto(comprobante.descripcion, normal, 10.5, CONTENIDO)) {
    asegurarEspacio(16);
    if (linea) texto(linea, { x: MARGEN, size: 10.5 });
    y -= 15.5;
  }

  // ── Cierre y firma ──
  asegurarEspacio(120);
  y -= 12;
  texto("Se extiende el presente comprobante a solicitud del paciente, para los fines que estime convenientes.", {
    x: MARGEN, size: 10, color: COLOR.gris,
  });
  y -= 70;
  const anchoFirma = 210;
  const xFirma = MARGEN + (CONTENIDO - anchoFirma) / 2;
  pagina.drawLine({ start: { x: xFirma, y }, end: { x: xFirma + anchoFirma, y }, thickness: 0.8, color: COLOR.gris });
  y -= 14;
  texto(comprobante.profesional_nombre, { x: xFirma, ancho: anchoFirma, alinear: "centro", size: 10.5, fuente: negrita, color: COLOR.azul });
  y -= 13;
  texto("Armonía Dental", { x: xFirma, ancho: anchoFirma, alinear: "centro", size: 9, color: COLOR.gris });

  // ── Pie de página en todas las páginas ──
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    pagina = p;
    y = 40;
    p.drawLine({ start: { x: MARGEN, y: 54 }, end: { x: ANCHO - MARGEN, y: 54 }, thickness: 1, color: COLOR.naranja });
    const izquierda = "ARMONÍA DENTAL";
    const derecha = `Comprobante ${comprobante.numero}${paginas.length > 1 ? `  ·  Página ${i + 1} de ${paginas.length}` : ""}`;
    const wI = negrita.widthOfTextAtSize(izquierda, 7.5);
    const wD = normal.widthOfTextAtSize(textoSeguroPdf(derecha), 7.5);
    const x0 = (ANCHO - (wI + 18 + wD)) / 2;
    texto(izquierda, { x: x0, size: 7.5, fuente: negrita, color: COLOR.azul });
    p.drawCircle({ x: x0 + wI + 9, y: y + 2.6, size: 1.6, color: COLOR.naranja });
    texto(derecha, { x: x0 + wI + 18, size: 7.5, color: COLOR.gris });
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
};

export const enviarComprobanteService = async (id, correoDestinoOpcional) => {
  const comprobante = await obtenerComprobante(id);
  const tieneCorreoOpcional =
    correoDestinoOpcional !== undefined && correoDestinoOpcional !== null;

  let correoBase = comprobante.correo_destino;

  // Si el comprobante no tiene correo, intenta con el del paciente
  if (!tieneCorreoOpcional && !normalizarCorreo(correoBase)) {
    const paciente = await PacienteModel.findById(comprobante.paciente_id);
    correoBase = paciente?.correo || "";
  }

  const correoDestino = normalizarCorreo(
    tieneCorreoOpcional ? correoDestinoOpcional : correoBase
  );

  if (!correoDestino) {
    throw crearError(
      "El paciente no tiene un correo registrado. No se pudo enviar el comprobante."
    );
  }

  validarCorreo(correoDestino);

  if (tieneCorreoOpcional) {
    comprobante.correo_destino = correoDestino;
    await comprobante.save();
  }

  try {
    const { buffer: pdfBuffer, nombre: nombreArchivo } = await obtenerArchivoComprobante(comprobante);

    const resultadoEnvio = await enviarCorreoComprobante({
      destinatario: correoDestino,
      nombrePaciente: comprobante.paciente_nombre,
      numero: comprobante.numero,
      pdfBuffer,
      nombreArchivo,
    });

    if (!resultadoEnvio.accepted?.length) {
      throw new Error("El servidor de correo rechazó el destinatario.");
    }

    return ComprobanteModel.findByIdAndUpdate(
      comprobante._id,
      {
        $set: {
          estado_envio: "enviado",
          correo_destino: correoDestino,
          enviado_a: correoDestino,
          enviado_en: new Date(),
          ultimo_error_envio: "",
        },
        $inc: {
          cantidad_envios: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  } catch (error) {
    await ComprobanteModel.findByIdAndUpdate(comprobante._id, {
      $set: {
        estado_envio: "error",
        correo_destino: correoDestino,
        ultimo_error_envio: ERROR_ENVIO_SEGURO,
      },
    });

    throw crearError(ERROR_ENVIO_SEGURO, 502);
  }
};

/* ───────── Versión firmada digitalmente ───────── */

export const TAMANO_MAXIMO_FIRMADO = 5 * 1024 * 1024; // 5 MB

/*
 * Un PDF con firma digital (PAdES, como la Firma Digital de Costa Rica) contiene un
 * diccionario de firma con /ByteRange y su contenido PKCS#7/CAdES. No valida el
 * certificado (eso lo hace el lector de PDF); evita subir por error el PDF sin firmar.
 */
export const tieneFirmaDigital = (buffer) => {
  const texto = buffer.toString("latin1");
  return /\/ByteRange\s*\[/.test(texto) && /\/(adbe\.pkcs7\.(detached|sha1)|ETSI\.CAdES\.detached)/.test(texto);
};

const nombreArchivo = (comprobante, firmado) =>
  `${comprobante.numero}${firmado ? "-firmado" : ""}.pdf`;

// PDF que se entrega al paciente: el firmado si existe; si no, el generado por el sistema
export const obtenerArchivoComprobante = async (comprobante, version = "preferido") => {
  if (version !== "generado" && comprobante.firmado) {
    const firmado = await ComprobanteFirmadoModel.findOne({ comprobante_id: comprobante._id }).lean();
    if (firmado?.archivo) {
      return { buffer: Buffer.from(firmado.archivo.buffer ?? firmado.archivo), nombre: nombreArchivo(comprobante, true), firmado: true };
    }
    if (version === "firmado") throw crearError("No se encontró la versión firmada de este comprobante.", 404);
  } else if (version === "firmado") {
    throw crearError("Este comprobante todavía no tiene una versión firmada.", 404);
  }
  return { buffer: await generarPdfComprobanteService(comprobante), nombre: nombreArchivo(comprobante, false), firmado: false };
};

export const subirComprobanteFirmadoService = async (id, archivo, usuario) => {
  const comprobante = await obtenerComprobante(id);

  if (!archivo?.buffer?.length) throw crearError("Adjunte el PDF firmado.");
  if (archivo.size > TAMANO_MAXIMO_FIRMADO) throw crearError("El archivo supera el tamaño máximo de 5 MB.");
  if (archivo.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw crearError("El archivo no es un PDF válido.");
  }
  if (!tieneFirmaDigital(archivo.buffer)) {
    throw crearError(
      "El PDF no tiene firma digital. Firme el comprobante con su firma digital y vuelva a subirlo."
    );
  }

  const subido_en = new Date();
  await ComprobanteFirmadoModel.findOneAndUpdate(
    { comprobante_id: comprobante._id },
    {
      $set: {
        archivo: archivo.buffer,
        nombre_original: String(archivo.originalname || "").slice(0, 200),
        tamano: archivo.size,
        sha256: crypto.createHash("sha256").update(archivo.buffer).digest("hex"),
        subido_por: { _id: usuario?._id, nombre: usuario?.nombre || "" },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return ComprobanteModel.findByIdAndUpdate(
    comprobante._id,
    {
      $set: {
        firmado: {
          nombre_original: String(archivo.originalname || "").slice(0, 200),
          tamano: archivo.size,
          subido_por_nombre: usuario?.nombre || "",
          subido_en,
        },
      },
    },
    { new: true }
  );
};

export const eliminarComprobanteFirmadoService = async (id) => {
  const comprobante = await obtenerComprobante(id);
  if (!comprobante.firmado) throw crearError("Este comprobante no tiene una versión firmada.", 404);
  await ComprobanteFirmadoModel.deleteOne({ comprobante_id: comprobante._id });
  return ComprobanteModel.findByIdAndUpdate(comprobante._id, { $set: { firmado: null } }, { new: true });
};

/* ───────── Envío por WhatsApp ───────── */

const plantillaComprobante = () =>
  process.env.WHATSAPP_PLANTILLA_COMPROBANTE || "comprobante_paciente";

const ERROR_WHATSAPP = "No fue posible enviar el comprobante por WhatsApp.";

export const enviarWhatsappComprobanteService = async (id, telefonoOpcional) => {
  const comprobante = await obtenerComprobante(id);

  let telefono = telefonoOpcional;
  if (!telefono) {
    const paciente = await PacienteModel.findById(comprobante.paciente_id).select("telefono").lean();
    telefono = paciente?.telefono || "";
  }
  const numero = normalizarTelefono(telefono);
  if (!numero) throw crearError("El paciente no tiene un teléfono registrado.");
  if (!/^\d{10,15}$/.test(numero)) throw crearError("El teléfono no es válido. Use 8 dígitos, por ejemplo 8888-7777.");
  if (!telefonoPermitido(numero)) {
    throw crearError("Este número no está en la lista de pruebas (WHATSAPP_LISTA_BLANCA), así que no se envió.");
  }

  try {
    const archivo = await obtenerArchivoComprobante(comprobante);
    const mediaId = await subirDocumentoWhatsapp(archivo.buffer, archivo.nombre);
    await enviarMensajePlantilla({
      telefono: numero,
      nombrePlantilla: plantillaComprobante(),
      parametrosNombrados: {
        nombre_paciente: comprobante.paciente_nombre,
        numero_comprobante: comprobante.numero,
      },
      conBotones: false,
      documento: { id: mediaId, filename: archivo.nombre },
    });

    return ComprobanteModel.findByIdAndUpdate(
      comprobante._id,
      {
        $set: {
          estado_whatsapp: "enviado",
          whatsapp_enviado_a: numero,
          whatsapp_enviado_en: new Date(),
          whatsapp_version_enviada: archivo.firmado ? "firmado" : "generado",
        },
        $inc: { cantidad_envios_whatsapp: 1 },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Error al enviar el comprobante por WhatsApp:", error.response?.data || error.message);
    await ComprobanteModel.findByIdAndUpdate(comprobante._id, { $set: { estado_whatsapp: "error" } });
    throw crearError(ERROR_WHATSAPP, 502);
  }
};
