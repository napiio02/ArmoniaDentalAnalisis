import { obtenerPacientesConExpediente } from "../controllers/PacienteController.js";

export const PacientesRoutes = (app) => {
  app.get("/api/pacientes", obtenerPacientesConExpediente);
};