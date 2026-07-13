import {
  obtenerPacientesConExpediente,
  crearPaciente,
  actualizarPaciente,
  obtenerPacientePorId,
  obtenerStatsPacientes,
  toggleActivoPaciente,   
} from "../controllers/PacienteController.js";

export const PacientesRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/pacientes`, obtenerPacientesConExpediente);
  app.post(`/${version}/pacientes`, crearPaciente);
  app.get(`/${version}/pacientes/stats`, obtenerStatsPacientes);  
  app.put(`/${version}/pacientes/:id`, actualizarPaciente);
  app.get(`/${version}/pacientes/:id`, obtenerPacientePorId);
  app.patch(`/${version}/pacientes/:id/status`, toggleActivoPaciente);
};