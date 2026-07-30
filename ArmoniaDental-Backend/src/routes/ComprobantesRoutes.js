import {
  crearComprobante,
  descargarPdfComprobante,
  enviarComprobante,
  listarComprobantes,
  obtenerComprobante,
} from "../controllers/ComprobanteController.js";
import { verifyToken } from "../middlewares/VerifyToken.js";

const ROL_PROFESIONAL = "Dentista";

const autorizarProfesional = (req, res, next) => {
  if (req.user.rol !== ROL_PROFESIONAL) {
    return res.status(403).json({
      ok: false,
      message:
        "No tiene permisos para realizar esta operación con comprobantes.",
      data: null,
    });
  }

  next();
};

export const ComprobantesRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(
    `/${version}/comprobantes`,
    verifyToken,
    listarComprobantes
  );
  app.get(
    `/${version}/comprobantes/:id`,
    verifyToken,
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
    descargarPdfComprobante
  );
  app.post(
    `/${version}/comprobantes/:id/enviar`,
    verifyToken,
    autorizarProfesional,
    enviarComprobante
  );
};
