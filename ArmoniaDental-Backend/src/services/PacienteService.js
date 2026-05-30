import PacienteModel from "../models/PacienteModel.js";
import ExpedienteModel from "../models/ExpedienteModel.js";

export async function obtenerPacientesConExpedienteService() {
  const pacientes = await PacienteModel.find({
    $or: [{ activo: true }, { activo: { $exists: false } }],
  })
    .sort({ nombre: 1 })
    .lean();

  const pacientesConExpediente = await Promise.all(
    pacientes.map(async (paciente) => {
      const expediente = await ExpedienteModel.findOne({
        paciente_id: paciente._id,
        $or: [{ activo: true }, { activo: { $exists: false } }],
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        _id: paciente._id,
        nombre: paciente.nombre || "Paciente sin nombre",
        cedula: paciente.cedula || "",
        correo: paciente.correo || "",
        telefono: paciente.telefono || "",
        activo: paciente.activo !== false,
        expediente_id: expediente?._id || "",
      };
    })
  );

  return pacientesConExpediente;
}