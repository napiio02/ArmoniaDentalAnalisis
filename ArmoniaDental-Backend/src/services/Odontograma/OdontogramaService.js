import mongoose from "mongoose";

import OdontogramaModel from "../../models/Odontograma/OdontogramaModel.js";
import HistorialModel from "../../models/Odontograma/HistorialModel.js";
import PacienteModel from "../../models/PacienteModel.js";
import ExpedienteModel from "../../models/ExpedienteModel.js";

const { ObjectId } = mongoose.Types;



function crearError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validarObjectId(id, nombreCampo) {
  if (!id || !ObjectId.isValid(id)) {
    throw crearError(`El identificador de ${nombreCampo} no es válido.`, 400);
  }
}

function normalizarObjectId(id) {
  return new ObjectId(id);
}

function filtroActivo() {
  return {
    $or: [{ activo: true }, { activo: { $exists: false } }],
  };
}



function validarPiezas(piezas = []) {
  if (!Array.isArray(piezas)) {
    throw crearError("Las piezas del odontograma deben enviarse como arreglo.", 400);
  }

  return piezas.map((pieza) => {
    const numero = Number(pieza.numero);

    if (!Number.isInteger(numero)) {
      throw crearError("Cada pieza debe tener un número válido.", 400);
    }

    const marks = Array.isArray(pieza.marks)
      ? pieza.marks
          .map((mark) => ({
            actionId: String(mark.actionId || "").trim(),
            area: String(mark.area || "").trim(),
          }))
          .filter((mark) => mark.actionId)
      : [];

    return {
      numero,
      marks,
      observacion: String(pieza.observacion || "").trim(),
    };
  });
}



function validarEventos(eventos = []) {
  if (!Array.isArray(eventos)) return [];

  return eventos
    .map((evento) => ({
      pieza_numero: Number(evento.pieza_numero),
      tipo_evento: String(evento.tipo_evento || "Actualización").trim(),
      accion_codigo: String(evento.accion_codigo || "").trim(),
      accion_nombre: String(evento.accion_nombre || "").trim(),
      area: String(evento.area || "").trim(),
      detalle: String(evento.detalle || "").trim(),
      observacion: String(evento.observacion || "").trim(),
    }))
    .filter((evento) => {
      return Number.isInteger(evento.pieza_numero) && evento.detalle;
    });
}



async function validarPacienteYExpediente({
  paciente_id,
  expediente_id,
  session = null,
}) {
  validarObjectId(paciente_id, "paciente");
  validarObjectId(expediente_id, "expediente");

  const pacienteObjectId = normalizarObjectId(paciente_id);
  const expedienteObjectId = normalizarObjectId(expediente_id);

  const paciente = await PacienteModel.findOne({
    _id: pacienteObjectId,
    ...filtroActivo(),
  }).session(session);

  if (!paciente) {
    throw crearError("El paciente no existe o no está activo.", 404);
  }

  const expediente = await ExpedienteModel.findOne({
    _id: expedienteObjectId,
    paciente_id: pacienteObjectId,
    ...filtroActivo(),
  }).session(session);

  if (!expediente) {
    throw crearError(
      "El expediente no existe, no está activo o no pertenece al paciente seleccionado.",
      400
    );
  }

  return {
    paciente,
    expediente,
    pacienteObjectId,
    expedienteObjectId,
  };
}



export async function obtenerOdontogramaPorPacienteService(pacienteId) {
  validarObjectId(pacienteId, "paciente");

  const pacienteObjectId = normalizarObjectId(pacienteId);

  const paciente = await PacienteModel.findOne({
    _id: pacienteObjectId,
    ...filtroActivo(),
  }).lean();

  if (!paciente) {
    throw crearError("El paciente no existe o no está activo.", 404);
  }

  const odontograma = await OdontogramaModel.findOne({
    paciente_id: pacienteObjectId,
    activo: true,
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!odontograma) {
    return null;
  }

  const historial = await HistorialModel.find({
    odontograma_id: odontograma._id,
    activo: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return {
    ...odontograma,
    paciente,
    historial,
  };
}



export async function guardarOdontogramaService(payload) {
  const {
    paciente_id,
    expediente_id,
    dentadura = "permanente",
    piezas = [],
    notas_generales = "",
    eventos = [],
    usuario_id,
  } = payload;

  validarObjectId(paciente_id, "paciente");
  validarObjectId(expediente_id, "expediente");

  if (!["permanente", "temporal"].includes(dentadura)) {
    throw crearError("El tipo de dentadura no es válido.", 400);
  }

  const piezasSanitizadas = validarPiezas(piezas);
  const eventosSanitizados = validarEventos(eventos);

  const usuarioIdFinal =
    usuario_id && ObjectId.isValid(usuario_id)
      ? normalizarObjectId(usuario_id)
      : normalizarObjectId(paciente_id);

  const session = await mongoose.startSession();

  try {
    let odontogramaGuardado = null;

    await session.withTransaction(async () => {
      const { pacienteObjectId, expedienteObjectId } =
        await validarPacienteYExpediente({
          paciente_id,
          expediente_id,
          session,
        });

      odontogramaGuardado = await OdontogramaModel.findOneAndUpdate(
        {
          paciente_id: pacienteObjectId,
          expediente_id: expedienteObjectId,
          activo: true,
        },
        {
          $set: {
            paciente_id: pacienteObjectId,
            expediente_id: expedienteObjectId,
            actualizado_por_id: usuarioIdFinal,
            dentadura,
            piezas: piezasSanitizadas,
            notas_generales: String(notas_generales || "").trim(),
            activo: true,
          },
          $setOnInsert: {
            creado_por_id: usuarioIdFinal,
          },
        },
        {
          new: true,
          upsert: true,
          session,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      if (eventosSanitizados.length > 0) {
        const historialDocs = eventosSanitizados.map((evento) => ({
          odontograma_id: odontogramaGuardado._id,
          paciente_id: pacienteObjectId,
          expediente_id: expedienteObjectId,
          registrado_por_id: usuarioIdFinal,
          pieza_numero: evento.pieza_numero,
          tipo_evento: evento.tipo_evento,
          accion_codigo: evento.accion_codigo,
          accion_nombre: evento.accion_nombre,
          area: evento.area,
          detalle: evento.detalle,
          observacion: evento.observacion,
          activo: true,
        }));

        await HistorialModel.insertMany(historialDocs, { session });
      }
    });

    return odontogramaGuardado;
  } finally {
    await session.endSession();
  }
}



export async function obtenerHistorialOdontogramaService(odontogramaId) {
  validarObjectId(odontogramaId, "odontograma");

  const odontogramaObjectId = normalizarObjectId(odontogramaId);

  const odontograma = await OdontogramaModel.findOne({
    _id: odontogramaObjectId,
    activo: true,
  }).lean();

  if (!odontograma) {
    throw crearError("El odontograma no existe o no está activo.", 404);
  }

  return HistorialModel.find({
    odontograma_id: odontogramaObjectId,
    activo: true,
  })
    .sort({ createdAt: -1 })
    .lean();
}