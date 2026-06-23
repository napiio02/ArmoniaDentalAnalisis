import mongoose from "mongoose";
import { obtenerExpedientesPorPacienteService } from "../services/ExpedienteService.js";

export async function obtenerExpedientesPorPaciente(req, res) {
  try {
    const { paciente_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paciente_id)) {
      return res.status(404).json({ ok: false, message: "Paciente no válido." });
    }

    const expedientes = await obtenerExpedientesPorPacienteService(paciente_id);

    return res.status(200).json({
      ok: true,
      message: "Expedientes obtenidos correctamente.",
      data: expedientes,
    });
  } catch (error) {
    console.error("Error al obtener expedientes:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al obtener los expedientes.",
      error: error.message,
    });
  }
}