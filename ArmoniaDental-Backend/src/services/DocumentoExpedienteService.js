import fs from "fs";
import path from "path";
import DocumentoExpediente from "../models/DocumentoExpedienteModel.js";

export async function subirDocumentoService({ expediente_id, paciente_id, tipo, archivo, usuario_id }) {
  const extension = path.extname(archivo.originalname).toLowerCase().replace(".", "");

  const documento = await DocumentoExpediente.create({
    expediente_id,
    paciente_id,
    tipo,
    nombre_original: archivo.originalname,
    nombre_archivo: archivo.filename,
    formato: extension,
    tamano_bytes: archivo.size,
    ruta_storage: archivo.path,
    subido_por: usuario_id || null,
  });

  return documento;
}

export async function obtenerDocumentosPorExpedienteService(expediente_id) {
  return await DocumentoExpediente.find({ expediente_id })
    .sort({ fecha_subida: -1 })
    .lean();
}

export async function obtenerDocumentoPorIdService(id) {
  return await DocumentoExpediente.findById(id);
}

export async function guardarAnotacionesService(id, anotaciones) {
  return await DocumentoExpediente.findByIdAndUpdate(
    id,
    { anotaciones },
    { new: true }
  );
}

export async function eliminarDocumentoService(id) {
  const documento = await DocumentoExpediente.findById(id);
  if (!documento) return null;

  // Borra el archivo físico del disco
  if (fs.existsSync(documento.ruta_storage)) {
    fs.unlinkSync(documento.ruta_storage);
  }

  await DocumentoExpediente.findByIdAndDelete(id);
  return documento;
}