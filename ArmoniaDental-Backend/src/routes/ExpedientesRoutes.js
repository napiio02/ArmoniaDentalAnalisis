import { obtenerExpedientesPorPaciente } from "../controllers/ExpedienteController.js";

export const ExpedientesRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/pacientes/:paciente_id/expedientes`, obtenerExpedientesPorPaciente);
};