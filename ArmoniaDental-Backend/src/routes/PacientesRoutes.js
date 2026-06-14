import { obtenerPacientesConExpediente } from "../controllers/PacienteController.js";

export const PacientesRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(
    `/${version}/pacientes`,
    obtenerPacientesConExpediente
  );
};