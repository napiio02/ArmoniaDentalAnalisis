import { verifyToken } from "../middlewares/VerifyToken.js";
import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import { obtenerExpedientesPorPaciente } from "../controllers/ExpedienteController.js";

const autorizarProfesional = autorizarRoles("Admin", "Dentista");

export const ExpedientesRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(
    `/${version}/pacientes/:id/expedientes`,
    verifyToken,
    autorizarProfesional,
    obtenerExpedientesPorPaciente
  );
};