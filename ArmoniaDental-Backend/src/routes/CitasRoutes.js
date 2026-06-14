import {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  cancelarCita,
  getDisponibilidad,
} from "../controllers/CitasController.js";

export const CitasRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/citas`, getCitas);

  app.get(`/${version}/citas/disponibilidad`, getDisponibilidad);

  app.get(`/${version}/citas/:id`, getCitaById);

  app.post(`/${version}/citas`, createCita);
  app.put(`/${version}/citas/:id`, updateCita);
  app.patch(`/${version}/citas/:id/cancelar`, cancelarCita);
};