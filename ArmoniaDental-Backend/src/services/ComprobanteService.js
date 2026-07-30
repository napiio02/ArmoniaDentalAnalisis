import mongoose from "mongoose";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import ComprobanteModel, {
  ConsecutivoComprobante,
  TIPOS_COMPROBANTE,
} from "../models/ComprobanteModel.js";
import PacienteModel from "../models/PacienteModel.js";
import { enviarCorreoComprobante } from "./EmailService.js";

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
  const correoDestino = normalizarCorreo(
    correoSolicitado
  );

  if (!correoDestino) {
    throw crearError(
      "El paciente no tiene un correo disponible para el comprobante."
    );
  }

  validarCorreo(correoDestino);

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

export const generarPdfComprobanteService = async (
  comprobanteOId
) => {
  const comprobante =
    typeof comprobanteOId === "string"
      ? await obtenerComprobante(comprobanteOId)
      : comprobanteOId;

  const pdf = await PDFDocument.create();
  const fuenteNormal = await pdf.embedFont(StandardFonts.Helvetica);
  const fuenteNegrita = await pdf.embedFont(
    StandardFonts.HelveticaBold
  );
  const anchoPagina = 612;
  const altoPagina = 792;
  const margen = 56;
  const anchoContenido = anchoPagina - margen * 2;
  let pagina;
  let y;

  const crearPagina = () => {
    pagina = pdf.addPage([anchoPagina, altoPagina]);
    y = altoPagina - margen;

    pagina.drawText("Armonía Dental", {
      x: margen,
      y,
      size: 20,
      font: fuenteNegrita,
      color: rgb(0, 0.4, 0.53),
    });

    y -= 28;
    pagina.drawText("Comprobante médico", {
      x: margen,
      y,
      size: 15,
      font: fuenteNegrita,
      color: rgb(0.08, 0.11, 0.15),
    });

    y -= 18;
    pagina.drawLine({
      start: { x: margen, y },
      end: { x: anchoPagina - margen, y },
      thickness: 1,
      color: rgb(0.75, 0.79, 0.81),
    });
    y -= 28;
  };

  const asegurarEspacio = (altoNecesario) => {
    if (y - altoNecesario < margen) {
      crearPagina();
    }
  };

  const dibujarCampo = (etiqueta, valor) => {
    const texto = textoSeguroPdf(valor || "No indicado");
    const anchoEtiqueta = 130;
    const lineas = dividirTexto(
      texto,
      fuenteNormal,
      11,
      anchoContenido - anchoEtiqueta
    );
    const alto = Math.max(1, lineas.length) * 16;

    asegurarEspacio(alto + 8);

    pagina.drawText(textoSeguroPdf(etiqueta), {
      x: margen,
      y,
      size: 11,
      font: fuenteNegrita,
      color: rgb(0.25, 0.28, 0.31),
    });

    lineas.forEach((linea, indice) => {
      pagina.drawText(linea, {
        x: margen + anchoEtiqueta,
        y: y - indice * 16,
        size: 11,
        font: fuenteNormal,
        color: rgb(0.08, 0.11, 0.15),
      });
    });

    y -= alto + 8;
  };

  crearPagina();
  dibujarCampo("Número", comprobante.numero);
  dibujarCampo("Tipo", comprobante.tipo);
  dibujarCampo("Paciente", comprobante.paciente_nombre);
  dibujarCampo("Cédula", comprobante.paciente_cedula);
  dibujarCampo("Fecha", formatearFecha(comprobante.fecha));

  const horario =
    comprobante.hora_inicio || comprobante.hora_fin
      ? `${comprobante.hora_inicio || "--:--"} - ${
          comprobante.hora_fin || "--:--"
        }`
      : "No indicado";

  dibujarCampo("Horario", horario);
  dibujarCampo("Profesional", comprobante.profesional_nombre);

  asegurarEspacio(44);
  y -= 8;
  pagina.drawText("Descripción", {
    x: margen,
    y,
    size: 11,
    font: fuenteNegrita,
    color: rgb(0.25, 0.28, 0.31),
  });
  y -= 20;

  const lineasDescripcion = dividirTexto(
    comprobante.descripcion,
    fuenteNormal,
    11,
    anchoContenido
  );

  for (const linea of lineasDescripcion) {
    asegurarEspacio(18);
    pagina.drawText(linea, {
      x: margen,
      y,
      size: 11,
      font: fuenteNormal,
      color: rgb(0.08, 0.11, 0.15),
    });
    y -= 16;
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
};

export const enviarComprobanteService = async (
  id,
  correoDestinoOpcional
) => {
  const comprobante = await obtenerComprobante(id);
  const tieneCorreoOpcional =
    correoDestinoOpcional !== undefined &&
    correoDestinoOpcional !== null;
  const correoDestino = normalizarCorreo(
    tieneCorreoOpcional
      ? correoDestinoOpcional
      : comprobante.correo_destino
  );

  if (!correoDestino) {
    throw crearError(
      "No existe un correo disponible para enviar el comprobante."
    );
  }

  validarCorreo(correoDestino);

  if (tieneCorreoOpcional) {
    comprobante.correo_destino = correoDestino;
    await comprobante.save();
  }

  try {
    const pdfBuffer = await generarPdfComprobanteService(comprobante);

    const resultadoEnvio = await enviarCorreoComprobante({
      destinatario: correoDestino,
      nombrePaciente: comprobante.paciente_nombre,
      numero: comprobante.numero,
      pdfBuffer,
      nombreArchivo: `${comprobante.numero}.pdf`,
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
