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

export async function crearPacienteService(datos) {
  const nuevoPaciente = await PacienteModel.create({
    nombre: datos.nombre,
    cedula: datos.cedula,
    telefono: datos.telefono,
    correo: datos.email || "",
    fecha_nacimiento: datos.fecha_nacimiento || null,
    alergias: datos.alergias || [],
    enfermedades: datos.enfermedades || [],
  });

  // Crear expediente inicial automáticamente
  await ExpedienteModel.create({
    paciente_id: nuevoPaciente._id,
    fecha: new Date(),
    tipo: "Control general",
    descripcion: "Expediente clínico activo del paciente.",
    activo: true,
  });

  return nuevoPaciente;
}

export async function obtenerPacientePorIdService(id) {
  const paciente = await PacienteModel.findById(id).lean();
  if (!paciente) return null;

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
    fecha_nacimiento: paciente.fecha_nacimiento || null,
    alergias: paciente.alergias || [],
    enfermedades: paciente.enfermedades || [],
    activo: paciente.activo !== false,
    expediente_id: expediente?._id || "",
  };
}

export async function actualizarPacientes(id, datos) {

  const paciente = await PacienteModel.findById(id);
  if (!paciente) {
    const error = new Error("Paciente no encontrado");
    error.statusCode = 404;
    throw error;
  }

  paciente.nombre = datos.nombre || paciente.nombre;
  paciente.cedula = datos.cedula || paciente.cedula;
  paciente.telefono = datos.telefono || paciente.telefono;
  paciente.correo = datos.email || paciente.correo;
  paciente.fecha_nacimiento = datos.fecha_nacimiento || paciente.fecha_nacimiento;
  paciente.alergias = datos.alergias || paciente.alergias;
  paciente.enfermedades = datos.enfermedades || paciente.enfermedades;

  await paciente.save();

  return paciente;
}