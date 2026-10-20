import { verifyToken } from "../middlewares/VerifyToken.js";
import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import {
  getConfiguracionAgenda,
  updateConfiguracionAgenda,
} from "../controllers/ConfiguracionAgendaController.js";

const autorizarProfesional = autorizarRoles("Admin", "Dentista");

export const ConfiguracionAgendaRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  // Cualquier usuario con sesión puede consultar el horario; solo Admin y Dentista lo modifican.
  app.get(`/${version}/agenda/configuracion`, verifyToken, getConfiguracionAgenda);
  app.put(`/${version}/agenda/configuracion`, verifyToken, autorizarProfesional, updateConfiguracionAgenda);
};
