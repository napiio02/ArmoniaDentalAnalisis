import fs from "fs";
import path from "path";
import DocumentoExpediente from "../models/DocumentoExpedienteModel.js";
import { PDFDocument, rgb } from "pdf-lib";

export async function generarPdfAnotadoService(id, anotaciones) {
  const documento = await DocumentoExpediente.findById(id);
  if (!documento) return null;

  const pdfBytes = fs.readFileSync(documento.ruta_storage);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const paginas = pdfDoc.getPages();

  for (const trazo of anotaciones) {
    const indicePagina = (trazo.pagina || 1) - 1;
    const pagina = paginas[indicePagina];
    if (!pagina) continue;

    const { width, height } = pagina.getSize();
    const puntos = trazo.puntos || [];
    if (puntos.length < 2) continue;

    const hex = (trazo.color || "#000000").replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Las coordenadas del canvas vienen con origen en top-left,
    // pero pdf-lib usa origen en bottom-left, hay que invertir Y
    // También hay que escalar de coordenadas canvas a coordenadas PDF
    const canvasWidth = trazo.canvasWidth || width;
    const canvasHeight = trazo.canvasHeight || height;
    const scaleX = width / canvasWidth;
    const scaleY = height / canvasHeight;

    for (let i = 0; i < puntos.length - 1; i++) {
      const p1 = puntos[i];
      const p2 = puntos[i + 1];

      pagina.drawLine({
        start: {
          x: p1.x * scaleX,
          y: height - p1.y * scaleY,   // invertir Y
        },
        end: {
          x: p2.x * scaleX,
          y: height - p2.y * scaleY,
        },
        thickness: trazo.grosor || 3,
        color: rgb(r, g, b),
        opacity: 1,
      });
    }
  }

  const pdfAnotadoBytes = await pdfDoc.save();
  return Buffer.from(pdfAnotadoBytes);
}

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