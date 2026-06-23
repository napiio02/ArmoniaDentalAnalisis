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

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (FORMATOS_PERMITIDOS.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de archivo no permitido."));
  }
};

export const uploadDocumento = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});