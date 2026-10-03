import { verifyToken } from "../middlewares/VerifyToken.js";
import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import { subirArchivo } from "../middlewares/uploadMiddleware.js";
import {
  subirDocumento,
  obtenerDocumentosPorExpediente,
  descargarDocumento,
  verDocumento,
  guardarAnotaciones,
  eliminarDocumento,
  descargarDocumentoAnotado,
} from "../controllers/DocumentoExpedienteController.js";

const autorizarProfesional = autorizarRoles("Admin", "Dentista");

export const DocumentosExpedienteRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.post(
    `/${version}/expedientes/:id/documentos`,
    verifyToken,
    autorizarProfesional,
    subirArchivo("archivo"),
    subirDocumento
  );
  app.get(
    `/${version}/expedientes/:id/documentos`,
    verifyToken,
    autorizarProfesional,
    obtenerDocumentosPorExpediente
  );
  app.get(
    `/${version}/documentos/:id/descargar`,
    verifyToken,
    autorizarProfesional,
    descargarDocumento
  );
  app.get(
    `/${version}/documentos/:id/ver`,
    verifyToken,
    autorizarProfesional,
    verDocumento
  );
  app.patch(
    `/${version}/documentos/:id/anotaciones`,
    verifyToken,
    autorizarProfesional,
    guardarAnotaciones
  );
  app.delete(
    `/${version}/documentos/:id`,
    verifyToken,
    autorizarProfesional,
    eliminarDocumento
  );
  app.post(
    `/${version}/documentos/:id/descargar-anotado`,
    verifyToken,
    autorizarProfesional,
    descargarDocumentoAnotado
  );
};