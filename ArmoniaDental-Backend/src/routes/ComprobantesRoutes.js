import multer from "multer";
import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import { verifyToken } from "../middlewares/VerifyToken.js";
import { TAMANO_MAXIMO_FIRMADO } from "../services/ComprobanteService.js";
import {
  crearComprobante,
  descargarPdfComprobante,
  eliminarComprobanteFirmado,
  enviarComprobante,
  enviarWhatsappComprobante,
  subirComprobanteFirmado,
  listarComprobantes,
  obtenerComprobante,
} from "../controllers/ComprobanteController.js";

const autorizarProfesional = autorizarRoles("Admin", "Dentista");

// PDF firmado: en memoria (se guarda en la base de datos, no en el disco), máximo 5 MB
const recibirPdfFirmado = (req, res, next) =>
  multer({ storage: multer.memoryStorage(), limits: { fileSize: TAMANO_MAXIMO_FIRMADO, files: 1 } })
    .single("archivo")(req, res, (error) => {
      if (!error) return next();
      const mensaje = error.code === "LIMIT_FILE_SIZE"
        ? "El archivo supera el tamaño máximo de 5 MB."
        : "No se pudo recibir el archivo. Adjunte un solo PDF en el campo \"archivo\".";
      return res.status(400).json({ ok: false, message: mensaje, data: null });
    });

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
  app.post(
    `/${version}/comprobantes/:id/firmado`,
    verifyToken,
    autorizarProfesional,
    recibirPdfFirmado,
    subirComprobanteFirmado
  );
  app.delete(
    `/${version}/comprobantes/:id/firmado`,
    verifyToken,
    autorizarProfesional,
    eliminarComprobanteFirmado
  );
  app.post(
    `/${version}/comprobantes/:id/whatsapp`,
    verifyToken,
    autorizarProfesional,
    enviarWhatsappComprobante
  );
};