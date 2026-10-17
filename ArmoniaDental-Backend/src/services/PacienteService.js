import PacienteModel from "../models/PacienteModel.js";
import ExpedienteModel from "../models/ExpedienteModel.js";

const lanzarError = (mensaje, statusCode) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  throw error;
};

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Reconoce la misma cédula escrita con o sin guiones/espacios (2-0987-0654 = 209870654)
const filtroCedula = (cedula) => {
  const limpia = String(cedula).trim();

  if (/^[\d\s-]+$/.test(limpia) && /\d/.test(limpia)) {
    const digitos = limpia.replace(/\D/g, "");
    return new RegExp(`^\\s*${digitos.split("").join("[-\\s]*")}\\s*$`);
  }

  return new RegExp(`^${escaparRegex(limpia)}$`, "i");
};

// La cédula es única por paciente (activos e inactivos)
const validarCedulaUnica = async (cedula, excluirId = null) => {
  const existente = await PacienteModel.findOne({
    cedula: filtroCedula(cedula),
    ...(excluirId && { _id: { $ne: excluirId } }),
  })
    .select("nombre")
    .lean();

  if (existente) {
    lanzarError(
      `Ya existe un paciente con la cédula ${cedula} (${existente.nombre}).`,
      409
    );
  }
};

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
  const cedula = String(datos.cedula).trim();
  await validarCedulaUnica(cedula);

  const nuevoPaciente = await PacienteModel.create({
    nombre: datos.nombre,
    cedula,
    telefono: datos.telefono,
    // El formulario envía "correo"; se acepta también "email" por compatibilidad
    correo: datos.correo ?? datos.email ?? "",
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
  if (!paciente) lanzarError("Paciente no encontrado", 404);

  // Campos obligatorios: si vienen, no pueden quedar vacíos
  for (const campo of ["nombre", "cedula", "telefono"]) {
    if (datos[campo] === undefined) continue;

    const valor = String(datos[campo]).trim();
    if (!valor) lanzarError(`El campo ${campo} no puede quedar vacío.`, 400);

    if (campo === "cedula" && valor !== paciente.cedula) {
      await validarCedulaUnica(valor, id);
    }

    paciente[campo] = valor;
  }

  // El formulario envía "correo"; se acepta también "email" por compatibilidad
  const correo = datos.correo ?? datos.email;
  if (correo !== undefined) paciente.correo = correo;

  // Se usa !== undefined (y no ||) para poder borrar valores opcionales
  if (datos.fecha_nacimiento !== undefined) {
    paciente.fecha_nacimiento = datos.fecha_nacimiento || null;
  }
  if (Array.isArray(datos.alergias)) paciente.alergias = datos.alergias;
  if (Array.isArray(datos.enfermedades)) paciente.enfermedades = datos.enfermedades;

  await paciente.save();

  return paciente;
}

export async function toggleActivoPacienteService(id) {
  const paciente = await PacienteModel.findById(id);
  if (!paciente) throw new Error("Paciente no encontrado");
  paciente.activo = !paciente.activo;
  await paciente.save();
  return paciente;
}