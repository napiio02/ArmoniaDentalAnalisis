import { uploadDocumento } from "../middlewares/uploadMiddleware.js";
import {
  subirDocumento,
  obtenerDocumentosPorExpediente,
  descargarDocumento,
  verDocumento,
  guardarAnotaciones,
  eliminarDocumento,
} from "../controllers/DocumentoExpedienteController.js";

export const DocumentosExpedienteRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.post(`/${version}/expedientes/:id/documentos`, uploadDocumento.single("archivo"), subirDocumento);
  app.get(`/${version}/expedientes/:id/documentos`, obtenerDocumentosPorExpediente);
  app.get(`/${version}/documentos/:id/descargar`, descargarDocumento);
  app.get(`/${version}/documentos/:id/ver`, verDocumento);
  app.patch(`/${version}/documentos/:id/anotaciones`, guardarAnotaciones);
  app.delete(`/${version}/documentos/:id`, eliminarDocumento);
};