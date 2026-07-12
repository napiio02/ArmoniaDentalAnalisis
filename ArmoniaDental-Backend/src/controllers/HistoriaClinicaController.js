import {
  crearHistoriaClinicaService,
  obtenerHistoriaClinicaPorPacienteService,
} from "../services/HistoriaClinicaService.js";

export async function crearHistoriaClinica(req, res) {
  try {
    const { paciente_id } = req.params;

    const historia = await crearHistoriaClinicaService(paciente_id, req.body);

    return res.status(201).json({
      ok: true,
      message: "Historia clínica guardada correctamente.",
      data: historia,
    });
  } catch (error) {
    console.error("Error al guardar historia clínica:", error);

    return res.status(error.status || 500).json({
      ok: false,
      message: error.status === 404
        ? error.message
        : "Ocurrió un error al guardar la historia clínica.",
      error: error.message,
    });
  }
}

export async function obtenerHistoriaClinicaPorPaciente(req, res) {
  try {
    const { paciente_id } = req.params;

    const historia = await obtenerHistoriaClinicaPorPacienteService(paciente_id);

    return res.status(200).json({
      ok: true,
      message: historia
        ? "Historia clínica obtenida correctamente."
        : "El paciente aún no tiene historia clínica registrada.",
      data: historia,
    });
  } catch (error) {
    console.error("Error al obtener historia clínica:", error);

    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al obtener la historia clínica.",
      error: error.message,
    });
  }
}
