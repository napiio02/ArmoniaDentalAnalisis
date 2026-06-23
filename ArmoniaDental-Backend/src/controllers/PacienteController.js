import { obtenerPacientesConExpedienteService, crearPacienteService, obtenerPacientePorIdService,} from "../services/PacienteService.js";


export async function obtenerPacientesConExpediente(req, res) {
  try {
    const pacientes = await obtenerPacientesConExpedienteService();

    return res.status(200).json({
      ok: true,
      message: "Pacientes obtenidos correctamente.",
      data: pacientes,
    });
  } catch (error) {
    console.error("Error al obtener pacientes:", error);

    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al obtener los pacientes.",
      data: [],
      error: error.message,
    });
  }
}

export async function crearPaciente(req, res) {
  try {
    const { nombre, cedula, telefono } = req.body;

    if (!nombre || !cedula || !telefono) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, cédula y teléfono son obligatorios.",
      });
    }

    const paciente = await crearPacienteService(req.body);

    return res.status(201).json({
      ok: true,
      message: "Paciente registrado correctamente.",
      data: paciente,
    });
  } catch (error) {
    console.error("Error al crear paciente:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al registrar el paciente.",
      error: error.message,
    });
  }
}

export async function obtenerPacientePorId(req, res) {
  try {
    const { id } = req.params;
    const paciente = await obtenerPacientePorIdService(id);

    if (!paciente) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró el paciente.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Paciente obtenido correctamente.",
      data: paciente,
    });
  } catch (error) {
    console.error("Error al obtener paciente:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al obtener el paciente.",
      error: error.message,
    });
  }
}