import mongoose from "mongoose";
import OdontogramaModel from "../../models/Odontograma/OdontogramaModel.js";
import HistorialModel from "../../models/Odontograma/HistorialModel.js";
import AccionesModel from "../../models/Odontograma/AccionesModel.js";
import PacienteModel from "../../models/PacienteModel.js";
import ExpedienteModel from "../../models/ExpedienteModel.js";
import { AREAS_DENTALES, PIEZAS_POR_DENTADURA } from "./OdontogramaCatalogo.js";

const { ObjectId } = mongoose.Types;
const TIPOS_POR_CARA = new Set(["faces", "shape"]);

function crearError(message, statusCode = 400, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

function errorConflicto() {
  return crearError(
    "El odontograma fue modificado por otra sesión. Recarga los datos antes de volver a guardar.",
    409,
    "ODONTOGRAM_CONFLICT",
  );
}

function validarObjectId(id, nombreCampo) {
  if (!id || !ObjectId.isValid(id)) {
    throw crearError(`El identificador de ${nombreCampo} no es válido.`);
  }
}

function filtroActivo() {
  return { $or: [{ activo: true }, { activo: { $exists: false } }] };
}

async function validarPacienteYExpediente({ paciente_id, expediente_id, session = null }) {
  validarObjectId(paciente_id, "paciente");
  validarObjectId(expediente_id, "expediente");
  const pacienteObjectId = new ObjectId(paciente_id);
  const expedienteObjectId = new ObjectId(expediente_id);
  const paciente = await PacienteModel.findOne({ _id: pacienteObjectId, ...filtroActivo() }).session(session);
  if (!paciente) throw crearError("El paciente no existe o no está activo.", 404);

  const expediente = await ExpedienteModel.findOne({
    _id: expedienteObjectId,
    paciente_id: pacienteObjectId,
    ...filtroActivo(),
  }).session(session);
  if (!expediente) {
    throw crearError("El expediente no existe, no está activo o no pertenece al paciente seleccionado.");
  }
  return { paciente, expedienteObjectId, pacienteObjectId };
}

async function obtenerCatalogo(session = null) {
  const consulta = AccionesModel.find({ activo: true }).sort({ grupo: 1, nombre: 1 });
  if (session) consulta.session(session);
  const acciones = await consulta.lean();
  return new Map(acciones.map((accion) => [accion.codigo, accion]));
}

export function validarPiezas(piezas, dentadura, catalogo) {
  if (!Array.isArray(piezas)) throw crearError("Las piezas del odontograma deben enviarse como arreglo.");
  const esperadas = PIEZAS_POR_DENTADURA[dentadura];
  if (!esperadas) throw crearError("El tipo de dentadura no es válido.");
  if (piezas.length !== esperadas.length) {
    throw crearError(`La dentición ${dentadura} debe contener exactamente ${esperadas.length} piezas.`);
  }

  const numerosEsperados = new Set(esperadas);
  const numerosRecibidos = new Set();
  const resultado = piezas.map((pieza) => {
    const numero = Number(pieza?.numero);
    if (!Number.isInteger(numero) || !numerosEsperados.has(numero)) {
      throw crearError(`La pieza ${pieza?.numero ?? "indicada"} no pertenece a la dentición ${dentadura}.`);
    }
    if (numerosRecibidos.has(numero)) throw crearError(`La pieza ${numero} está duplicada.`);
    numerosRecibidos.add(numero);
    if (!Array.isArray(pieza.marks)) throw crearError(`Las marcas de la pieza ${numero} deben ser un arreglo.`);
    if (pieza.marks.length > 30) throw crearError(`La pieza ${numero} supera el máximo de 30 marcas.`);

    const marcasVistas = new Set();
    const gruposExclusivos = new Set();
    const marks = pieza.marks.map((mark) => {
      const actionId = String(mark?.actionId || "").trim();
      const area = String(mark?.area || "").trim();
      const accion = catalogo.get(actionId);
      if (!accion) throw crearError(`La acción ${actionId || "indicada"} no existe o está inactiva.`);
      const areaEsperada = accion.tipo_render === "label" ? "label"
        : TIPOS_POR_CARA.has(accion.tipo_render) ? null : "whole";
      if (areaEsperada && area !== areaEsperada) {
        throw crearError(`${accion.nombre} debe aplicarse sobre la pieza completa.`);
      }
      if (!areaEsperada && !AREAS_DENTALES.includes(area)) {
        throw crearError(`${accion.nombre} debe indicar una cara dental válida.`);
      }
      const clave = `${actionId}:${area}`;
      if (marcasVistas.has(clave)) throw crearError(`${accion.nombre} está duplicada en la pieza ${numero}.`);
      marcasVistas.add(clave);
      if (accion.grupo_exclusivo) {
        if (gruposExclusivos.has(accion.grupo_exclusivo)) {
          throw crearError(`La pieza ${numero} contiene estados incompatibles del grupo ${accion.grupo_exclusivo}.`);
        }
        gruposExclusivos.add(accion.grupo_exclusivo);
      }
      return { actionId, area };
    });

    const observacion = String(pieza.observacion || "").trim();
    if (observacion.length > 1000) throw crearError(`La observación de la pieza ${numero} supera 1000 caracteres.`);
    return { numero, marks, observacion };
  });

  return resultado.sort((a, b) => esperadas.indexOf(a.numero) - esperadas.indexOf(b.numero));
}

const mapaPiezas = (piezas = []) => new Map(piezas.map((pieza) => [Number(pieza.numero), pieza]));
const claveMarca = (mark) => `${mark.actionId}:${mark.area}`;
const detalleArea = (area) => AREAS_DENTALES.includes(area) ? ` en cara ${area}` : " en la pieza";

export function generarEventosHistorial({ anteriores = [], nuevas = [], notasAnteriores = "", notasNuevas = "", catalogo }) {
  const eventos = [];
  const previas = mapaPiezas(anteriores);
  for (const piezaNueva of nuevas) {
    const piezaAnterior = previas.get(piezaNueva.numero) || { marks: [], observacion: "" };
    const marksAnteriores = new Map((piezaAnterior.marks || []).map((mark) => [claveMarca(mark), mark]));
    const marksNuevas = new Map((piezaNueva.marks || []).map((mark) => [claveMarca(mark), mark]));

    for (const [clave, mark] of marksAnteriores) {
      if (marksNuevas.has(clave)) continue;
      const accion = catalogo.get(mark.actionId);
      eventos.push({ ambito: "pieza", pieza_numero: piezaNueva.numero, tipo_evento: "Actualización",
        accion_codigo: mark.actionId, accion_nombre: accion?.nombre || mark.actionId, area: mark.area,
        detalle: `Se eliminó ${accion?.nombre || mark.actionId}${detalleArea(mark.area)}.` });
    }
    for (const [clave, mark] of marksNuevas) {
      if (marksAnteriores.has(clave)) continue;
      const accion = catalogo.get(mark.actionId);
      eventos.push({ ambito: "pieza", pieza_numero: piezaNueva.numero, tipo_evento: "Registro",
        accion_codigo: mark.actionId, accion_nombre: accion.nombre, area: mark.area,
        detalle: `${accion.nombre} registrado${detalleArea(mark.area)}.` });
    }

    const observacionAnterior = String(piezaAnterior.observacion || "").trim();
    if (observacionAnterior !== piezaNueva.observacion) {
      eventos.push({ ambito: "pieza", pieza_numero: piezaNueva.numero, tipo_evento: "Observación",
        accion_codigo: "", accion_nombre: "", area: "pieza",
        detalle: piezaNueva.observacion ? "Se actualizó la observación clínica de la pieza."
          : "Se eliminó la observación clínica de la pieza.", observacion: piezaNueva.observacion });
    }
  }

  if (String(notasAnteriores || "").trim() !== notasNuevas) {
    eventos.push({ ambito: "general", pieza_numero: null, tipo_evento: "Observación",
      accion_codigo: "", accion_nombre: "", area: "general",
      detalle: notasNuevas ? "Se actualizaron las notas generales." : "Se eliminaron las notas generales.",
      observacion: notasNuevas });
  }
  return eventos;
}

async function obtenerHistorial(odontogramaId, session = null) {
  const consulta = HistorialModel.find({ odontograma_id: odontogramaId, activo: true })
    .populate("registrado_por_id", "nombre").sort({ createdAt: -1 });
  if (session) consulta.session(session);
  return consulta.lean();
}

export async function obtenerAccionesOdontogramaService() {
  const acciones = await AccionesModel.find({ activo: true }).sort({ grupo: 1, nombre: 1 }).lean();
  const grupos = [];
  for (const accion of acciones) {
    let grupo = grupos.find((item) => item.group === accion.grupo);
    if (!grupo) { grupo = { group: accion.grupo, items: [] }; grupos.push(grupo); }
    grupo.items.push({ id: accion.codigo, label: accion.nombre, color: accion.color,
      shortLabel: accion.abreviatura, type: accion.tipo_render,
      exclusiveGroup: accion.grupo_exclusivo || "" });
  }
  return grupos;
}

export async function obtenerOdontogramasPorPacienteService(pacienteId, expedienteId) {
  const { paciente, expedienteObjectId, pacienteObjectId } = await validarPacienteYExpediente({
    paciente_id: pacienteId,
    expediente_id: expedienteId,
  });
  const odontogramas = await OdontogramaModel.find({ paciente_id: pacienteObjectId,
    expediente_id: expedienteObjectId, activo: true }).lean();
  const resultado = { permanente: null, temporal: null };
  await Promise.all(odontogramas.map(async (odontograma) => {
    resultado[odontograma.dentadura] = { ...odontograma, historial: await obtenerHistorial(odontograma._id) };
  }));
  return { paciente: paciente.toObject ? paciente.toObject() : paciente,
    expediente_id: expedienteObjectId, odontogramas: resultado };
}

export async function guardarOdontogramaService(payload) {
  const { paciente_id, expediente_id, dentadura, piezas, notas_generales = "", usuario_id, version } = payload;
  validarObjectId(usuario_id, "usuario autenticado");
  if (!PIEZAS_POR_DENTADURA[dentadura]) throw crearError("El tipo de dentadura no es válido.");
  const notasSanitizadas = String(notas_generales || "").trim();
  if (notasSanitizadas.length > 2000) throw crearError("Las notas generales superan 2000 caracteres.");
  const session = await mongoose.startSession();
  let guardado;

  try {
    await session.withTransaction(async () => {
      const { pacienteObjectId, expedienteObjectId } = await validarPacienteYExpediente({
        paciente_id, expediente_id, session,
      });
      const catalogo = await obtenerCatalogo(session);
      const piezasSanitizadas = validarPiezas(piezas, dentadura, catalogo);
      const filtro = { paciente_id: pacienteObjectId, expediente_id: expedienteObjectId, dentadura, activo: true };
      const existente = await OdontogramaModel.findOne(filtro).session(session);
      let eventos;

      if (existente) {
        if (!Number.isInteger(version) || version !== existente.__v) throw errorConflicto();
        eventos = generarEventosHistorial({ anteriores: existente.piezas, nuevas: piezasSanitizadas,
          notasAnteriores: existente.notas_generales, notasNuevas: notasSanitizadas, catalogo });
        if (eventos.length === 0) {
          guardado = existente;
          return;
        }
        existente.piezas = piezasSanitizadas;
        existente.notas_generales = notasSanitizadas;
        existente.actualizado_por_id = new ObjectId(usuario_id);
        guardado = await existente.save({ session });
      } else {
        if (version !== null && version !== undefined) throw errorConflicto();
        eventos = generarEventosHistorial({ nuevas: piezasSanitizadas, notasNuevas: notasSanitizadas, catalogo });
        [guardado] = await OdontogramaModel.create([{ ...filtro, piezas: piezasSanitizadas,
          notas_generales: notasSanitizadas, creado_por_id: new ObjectId(usuario_id),
          actualizado_por_id: new ObjectId(usuario_id) }], { session });
      }

      if (eventos.length) {
        await HistorialModel.insertMany(eventos.map((evento) => ({ ...evento,
          odontograma_id: guardado._id, paciente_id: pacienteObjectId, expediente_id: expedienteObjectId,
          registrado_por_id: new ObjectId(usuario_id), activo: true })), { session });
      }
    });
  } catch (error) {
    if (error?.name === "VersionError" || error?.code === 11000) throw errorConflicto();
    throw error;
  } finally {
    await session.endSession();
  }

  const odontograma = await OdontogramaModel.findById(guardado._id).lean();
  return { ...odontograma, historial: await obtenerHistorial(guardado._id) };
}

export async function obtenerHistorialOdontogramaService(odontogramaId) {
  validarObjectId(odontogramaId, "odontograma");
  const odontograma = await OdontogramaModel.findOne({ _id: new ObjectId(odontogramaId), activo: true }).lean();
  if (!odontograma) throw crearError("El odontograma no existe o no está activo.", 404);
  return obtenerHistorial(odontograma._id);
}
