import HistoriaClinicaModel from "../models/HistoriaClinicaModel.js";
import PacienteModel from "../models/PacienteModel.js";

export async function crearHistoriaClinicaService(pacienteId, datos) {
  const paciente = await PacienteModel.findById(pacienteId);
  if (!paciente) {
    const error = new Error("El paciente no existe.");
    error.status = 404;
    throw error;
  }

  const historiaExistente = await HistoriaClinicaModel.findOne({ paciente_id: pacienteId });
  if (historiaExistente) {
    const actualizada = await HistoriaClinicaModel.findOneAndUpdate(
      { paciente_id: pacienteId },
      { ...datos, paciente_id: pacienteId },
      { new: true, runValidators: true }
    );
    return actualizada;
  }

  const nuevaHistoria = await HistoriaClinicaModel.create({
    ...datos,
    paciente_id: pacienteId,
  });

  return nuevaHistoria;
}

export async function obtenerHistoriaClinicaPorPacienteService(pacienteId) {
  const historia = await HistoriaClinicaModel.findOne({
    paciente_id: pacienteId,
    $or: [{ activo: true }, { activo: { $exists: false } }],
  }).lean();

  return historia;
}
