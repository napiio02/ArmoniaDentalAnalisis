import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "expedientes");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const nombreUnico = `${crypto.randomUUID()}${extension}`;
    cb(null, nombreUnico);
  },
});

const FORMATOS_PERMITIDOS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
const TAMANO_MAXIMO_MB = 15;

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (FORMATOS_PERMITIDOS.includes(extension)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Formato de archivo no permitido. Solo se aceptan PDF, Word, JPG o PNG."
    );
    error.code = "INVALID_FILE_TYPE";
    cb(error);
  }
};

export const uploadDocumento = multer({
  storage,
  fileFilter,
  limits: { fileSize: TAMANO_MAXIMO_MB * 1024 * 1024 },
});

/**
 * Envuelve uploadDocumento.single(campo) para que los errores de carga
 * (formato no permitido, archivo muy grande, etc.) respondan un JSON 400
 * en lugar de la página HTML de error por defecto de Express.
 */
export const subirArchivo = (campo = "archivo") => (req, res, next) => {
  uploadDocumento.single(campo)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        ok: false,
        code: "FILE_TOO_LARGE",
        message: `El archivo no puede superar los ${TAMANO_MAXIMO_MB}MB.`,
        data: null,
      });
    }

    if (err.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        ok: false,
        code: "INVALID_FILE_TYPE",
        message: err.message,
        data: null,
      });
    }

    return res.status(400).json({
      ok: false,
      code: "UPLOAD_ERROR",
      message: "No se pudo procesar el archivo. Intente de nuevo.",
      data: null,
    });
  });
};