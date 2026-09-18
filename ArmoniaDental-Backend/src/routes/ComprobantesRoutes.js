import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import {
  crearComprobante,
  descargarPdfComprobante,
  enviarComprobante,
  listarComprobantes,
  obtenerComprobante,
} from "../controllers/ComprobanteController.js";
import { verifyToken } from "../middlewares/VerifyToken.js";

const autorizarProfesional = autorizarRoles("Admin", "Dentista");

export const ComprobantesRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(
    `/${version}/comprobantes`,
    verifyToken,
    autorizarProfesional,
    listarComprobantes
  );
  app.get(
    `/${version}/comprobantes/:id`,
    verifyToken,
    autorizarProfesional,
    obtenerComprobante
  );
  app.post(
    `/${version}/comprobantes`,
    verifyToken,
    autorizarProfesional,
    crearComprobante
  );
  app.get(
    `/${version}/comprobantes/:id/pdf`,
    verifyToken,
    autorizarProfesional,
    descargarPdfComprobante
  );
  app.post(
    `/${version}/comprobantes/:id/enviar`,
    verifyToken,
    autorizarProfesional,
    enviarComprobante
  );
};
