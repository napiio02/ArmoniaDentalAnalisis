import { verifyToken } from "../middlewares/VerifyToken.js";
import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import {
  listarProcedimientos,
  crearProcedimiento,
  actualizarProcedimiento,
  anularProcedimiento,
  registrarAbono,
  anularAbono,
} from "../controllers/ProcedimientoController.js";

// Información de cobros del paciente: solo profesionales (igual que el expediente)
const autorizar = autorizarRoles("Admin", "Dentista");

export const ProcedimientosRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/pacientes/:paciente_id/procedimientos`, verifyToken, autorizar, listarProcedimientos);
  app.post(`/${version}/pacientes/:paciente_id/procedimientos`, verifyToken, autorizar, crearProcedimiento);
  app.put(`/${version}/procedimientos/:id`, verifyToken, autorizar, actualizarProcedimiento);
  app.patch(`/${version}/procedimientos/:id/anular`, verifyToken, autorizar, anularProcedimiento);
  app.post(`/${version}/procedimientos/:id/abonos`, verifyToken, autorizar, registrarAbono);
  app.patch(`/${version}/procedimientos/:id/abonos/:abono_id/anular`, verifyToken, autorizar, anularAbono);
};
