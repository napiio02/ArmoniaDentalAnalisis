import { verifyToken } from "../middlewares/VerifyToken.js";
import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import {
  crearHistoriaClinica,
  obtenerHistoriaClinicaPorPaciente,
} from "../controllers/HistoriaClinicaController.js";

// Solo profesionales pueden VER la historia clínica
const autorizarProfesional = autorizarRoles("Admin", "Dentista");

// La Asistente Dental también puede REGISTRARLA (al crear un paciente nuevo)
const autorizarRegistro = autorizarRoles("Admin", "Dentista", "Asistente");

export const HistoriaClinicaRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.post(
    `/${version}/pacientes/:paciente_id/historia-clinica`,
    verifyToken,
    autorizarRegistro,
    crearHistoriaClinica
  );
  app.get(
    `/${version}/pacientes/:paciente_id/historia-clinica`,
    verifyToken,
    autorizarProfesional,
    obtenerHistoriaClinicaPorPaciente
  );
};
