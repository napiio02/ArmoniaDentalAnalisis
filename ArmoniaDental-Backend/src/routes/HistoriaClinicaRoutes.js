import { verifyToken } from "../middlewares/VerifyToken.js";
import {
  crearHistoriaClinica,
  obtenerHistoriaClinicaPorPaciente,
} from "../controllers/HistoriaClinicaController.js";

export const HistoriaClinicaRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.post(`/${version}/pacientes/:paciente_id/historia-clinica`, verifyToken, crearHistoriaClinica);
  app.get(`/${version}/pacientes/:paciente_id/historia-clinica`, verifyToken, obtenerHistoriaClinicaPorPaciente);
};
