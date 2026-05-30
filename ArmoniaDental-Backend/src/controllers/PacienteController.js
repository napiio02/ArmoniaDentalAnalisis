import { obtenerPacientesConExpedienteService } from "../services/PacienteService.js";

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