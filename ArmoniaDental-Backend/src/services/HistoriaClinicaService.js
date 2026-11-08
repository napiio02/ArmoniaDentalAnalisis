import HistoriaClinicaModel from "../models/HistoriaClinicaModel.js";
import PacienteModel from "../models/PacienteModel.js";

/*
 * Las alergias y enfermedades del paciente se guardan en UN solo lugar (el paciente),
 * pero se registran y editan únicamente desde la historia clínica. Así no se piden dos veces.
 */

// Campos del cuestionario que el cliente puede guardar (evita que escriba campos internos)
const CAMPOS_INTERNOS = ["_id", "__v", "paciente_id", "activo", "createdAt", "updatedAt"];
const CAMPOS_HISTORIA = Object.keys(HistoriaClinicaModel.schema.paths).filter(
  (campo) => !CAMPOS_INTERNOS.includes(campo)
);

const MAX_ETIQUETAS = 30;

// Lista limpia: sin vacíos ni repetidos; "Ninguna" solo si no hay otra opción marcada
export const normalizarEtiquetas = (lista) => {
  if (!Array.isArray(lista)) return undefined;

  const vistas = new Set();
  const limpias = [];
  for (const valor of lista) {
    const texto = String(valor ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
    const clave = texto.toLocaleLowerCase("es");
    if (!texto || vistas.has(clave)) continue;
    vistas.add(clave);
    limpias.push(texto);
  }

  const sinNinguna = limpias.filter((t) => t.toLocaleLowerCase("es") !== "ninguna");
  if (sinNinguna.length > 0) return sinNinguna.slice(0, MAX_ETIQUETAS);
  return limpias.length > 0 ? ["Ninguna"] : [];
};

// Solo los campos del cuestionario que vienen en la petición
export const extraerCuestionario = (datos = {}) =>
  Object.fromEntries(
    CAMPOS_HISTORIA.filter((campo) => datos[campo] !== undefined).map((campo) => [campo, datos[campo]])
  );

const conAntecedentes = (historia, paciente) =>
  historia
    ? {
        ...historia,
        alergias: paciente?.alergias ?? [],
        enfermedades: paciente?.enfermedades ?? [],
      }
    : null;

export async function crearHistoriaClinicaService(pacienteId, datos = {}) {
  const paciente = await PacienteModel.findById(pacienteId).select("_id").lean();
  if (!paciente) {
    const error = new Error("El paciente no existe.");
    error.status = 404;
    throw error;
  }

  // Alergias y enfermedades: se actualizan en el paciente solo si vienen en la petición
  const antecedentes = {};
  const alergias = normalizarEtiquetas(datos.alergias);
  const enfermedades = normalizarEtiquetas(datos.enfermedades);
  if (alergias) antecedentes.alergias = alergias;
  if (enfermedades) antecedentes.enfermedades = enfermedades;
  if (Object.keys(antecedentes).length > 0) {
    await PacienteModel.updateOne({ _id: pacienteId }, { $set: antecedentes });
  }

  // Crea la historia si no existe o actualiza la existente (un paciente tiene una sola historia)
  const cuestionario = extraerCuestionario(datos);
  const historia = await HistoriaClinicaModel.findOneAndUpdate(
    { paciente_id: pacienteId },
    {
      ...(Object.keys(cuestionario).length > 0 && { $set: cuestionario }),
      $setOnInsert: { paciente_id: pacienteId },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  const actualizado = await PacienteModel.findById(pacienteId).select("alergias enfermedades").lean();
  return conAntecedentes(historia, actualizado);
}

export async function obtenerHistoriaClinicaPorPacienteService(pacienteId) {
  const historia = await HistoriaClinicaModel.findOne({
    paciente_id: pacienteId,
    $or: [{ activo: true }, { activo: { $exists: false } }],
  }).lean();

  if (!historia) return null;

  const paciente = await PacienteModel.findById(pacienteId).select("alergias enfermedades").lean();
  return conAntecedentes(historia, paciente);
}
