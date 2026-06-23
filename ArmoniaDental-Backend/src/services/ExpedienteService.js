import ExpedienteModel from "../models/ExpedienteModel.js";

export async function obtenerExpedientesPorPacienteService(paciente_id) {
  return await ExpedienteModel.find({
    paciente_id,
    $or: [{ activo: true }, { activo: { $exists: false } }],
  })
    .sort({ fecha: -1 })
    .lean();
}