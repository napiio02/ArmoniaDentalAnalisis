import { verifyToken } from "../middlewares/VerifyToken.js";
import { uploadDocumento } from "../middlewares/uploadMiddleware.js";
import {
  subirDocumento,
  obtenerDocumentosPorExpediente,
  descargarDocumento,
  verDocumento,
  guardarAnotaciones,
  eliminarDocumento,
} from "../controllers/DocumentoExpedienteController.js";
import { descargarDocumentoAnotado } from "../controllers/DocumentoExpedienteController.js";

export const DocumentosExpedienteRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.post(`/${version}/expedientes/:id/documentos`, verifyToken, uploadDocumento.single("archivo"), subirDocumento);
  app.get(`/${version}/expedientes/:id/documentos`, verifyToken, obtenerDocumentosPorExpediente);
  app.get(`/${version}/documentos/:id/descargar`, verifyToken, descargarDocumento);
  app.get(`/${version}/documentos/:id/ver`, verifyToken, verDocumento);
  app.patch(`/${version}/documentos/:id/anotaciones`, verifyToken, guardarAnotaciones);
  app.delete(`/${version}/documentos/:id`, verifyToken, eliminarDocumento);
  app.post(`/${version}/documentos/:id/descargar-anotado`, verifyToken, descargarDocumentoAnotado);
};
