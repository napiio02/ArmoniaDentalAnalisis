import {
  obtenerPacientesConExpediente,
  crearPaciente,
  actualizarPaciente,
  obtenerPacientePorId,   
} from "../controllers/PacienteController.js";

export const PacientesRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/pacientes`, obtenerPacientesConExpediente);
  app.post(`/${version}/pacientes`, crearPaciente);
  app.put(`/${version}/pacientes/:id`, actualizarPaciente);
  app.get(`/${version}/pacientes/:id`, obtenerPacientePorId);   
};