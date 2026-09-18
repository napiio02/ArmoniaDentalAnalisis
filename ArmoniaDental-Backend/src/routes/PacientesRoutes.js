import { verifyToken } from "../middlewares/VerifyToken.js";
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

  app.get(`/${version}/pacientes`, verifyToken, obtenerPacientesConExpediente);
  app.post(`/${version}/pacientes`, verifyToken, crearPaciente);
  app.get(`/${version}/pacientes/stats`, verifyToken, obtenerStatsPacientes);
  app.put(`/${version}/pacientes/:id`, verifyToken, actualizarPaciente);
  app.get(`/${version}/pacientes/:id`, verifyToken, obtenerPacientePorId);
  app.patch(`/${version}/pacientes/:id/status`, verifyToken, toggleActivoPaciente);
};
