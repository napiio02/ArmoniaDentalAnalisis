import { verifyToken } from "../middlewares/VerifyToken.js";
import {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  cancelarCita,
  getDisponibilidad,
  getCitasAtendidasPorPaciente,
  getActividadReciente,
} from "../controllers/CitasController.js";

export const CitasRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/citas`, verifyToken, getCitas);

  app.get(`/${version}/citas/disponibilidad`, verifyToken, getDisponibilidad);

  app.get(`/${version}/citas/:id`, verifyToken, getCitaById);

  app.post(`/${version}/citas`, verifyToken, createCita);

  app.put(`/${version}/citas/:id`, verifyToken, updateCita);

  app.patch(`/${version}/citas/:id/cancelar`, verifyToken, cancelarCita);

  app.get(`/${version}/pacientes/:paciente_id/citas-atendidas`, verifyToken, getCitasAtendidasPorPaciente);

  app.get(`/${version}/actividad-reciente`, verifyToken, getActividadReciente);
};

