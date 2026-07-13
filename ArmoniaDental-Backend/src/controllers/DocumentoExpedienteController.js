import mongoose from "mongoose";
import {
  subirDocumentoService,
  obtenerDocumentosPorExpedienteService,
  obtenerDocumentoPorIdService,
  guardarAnotacionesService,
  eliminarDocumentoService,
} from "../services/DocumentoExpedienteService.js";
import { generarPdfAnotadoService } from "../services/DocumentoExpedienteService.js";
import fs from "fs";

export async function descargarDocumentoAnotado(req, res) {
  try {
    const { id } = req.params;
    const { anotaciones } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ ok: false, message: "Documento no válido." });
    }

    const pdfBuffer = await generarPdfAnotadoService(id, anotaciones || []);

    if (!pdfBuffer) {
      return res
        .status(404)
        .json({ ok: false, message: "Documento no encontrado." });
    }

    const documento = await (
      await import("../models/DocumentoExpedienteModel.js")
    ).default.findById(id);
    const nombreDescarga = documento.nombre_original;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(nombreDescarga)}"; filename*=UTF-8''${encodeURIComponent(nombreDescarga)}`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error al generar PDF anotado:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al generar el PDF anotado.",
      error: error.message,
    });
  }
}

export async function subirDocumento(req, res) {
  try {
    const { id } = req.params; // expediente_id
    const { tipo, paciente_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ ok: false, message: "Expediente no válido." });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, message: "No se recibió ningún archivo." });
    }

    if (!paciente_id) {
      return res
        .status(400)
        .json({ ok: false, message: "El paciente_id es obligatorio." });
    }

    const documento = await subirDocumentoService({
      expediente_id: id,
      paciente_id,
      tipo,
      archivo: req.file,
      usuario_id: req.usuario?._id || null,
    });

    return res.status(201).json({
      ok: true,
      message: "Documento subido correctamente.",
      data: documento,
    });
  } catch (error) {
    console.error("Error al subir documento:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al subir el documento.",
      error: error.message,
    });
  }
}

export async function obtenerDocumentosPorExpediente(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ ok: false, message: "Expediente no válido." });
    }

    const documentos = await obtenerDocumentosPorExpedienteService(id);

    return res.status(200).json({
      ok: true,
      message: "Documentos obtenidos correctamente.",
      data: documentos,
    });
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al obtener los documentos.",
      error: error.message,
    });
  }
}

export async function descargarDocumento(req, res) {
  try {
    const { id } = req.params;

    const documento = await obtenerDocumentoPorIdService(id);

    if (!documento) {
      return res
        .status(404)
        .json({ ok: false, message: "Documento no encontrado." });
    }

    if (!fs.existsSync(documento.ruta_storage)) {
      return res
        .status(404)
        .json({
          ok: false,
          message: "El archivo no se encuentra en el servidor.",
        });
    }

    return res.download(documento.ruta_storage, documento.nombre_original);
  } catch (error) {
    console.error("Error al descargar documento:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al descargar el documento.",
      error: error.message,
    });
  }
}

export async function verDocumento(req, res) {
  try {
    const { id } = req.params;

    const documento = await obtenerDocumentoPorIdService(id);

    if (!documento) {
      return res
        .status(404)
        .json({ ok: false, message: "Documento no encontrado." });
    }
    if (!fs.existsSync(documento.ruta_storage)) {
      return res.status(404).json({
        ok: false,
        message: "El archivo no se encuentra en el servidor.",
      });
    }
    return res.sendFile(documento.ruta_storage);
  } catch (error) {
    console.error("Error al mostrar documento:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al mostrar el documento.",
      error: error.message,
    });
  }
}

export async function guardarAnotaciones(req, res) {
  try {
    const { id } = req.params;
    const { anotaciones } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ ok: false, message: "Documento no válido." });
    }

    const documento = await guardarAnotacionesService(id, anotaciones);

    if (!documento) {
      return res
        .status(404)
        .json({ ok: false, message: "Documento no encontrado." });
    }

    return res.status(200).json({
      ok: true,
      message: "Anotaciones guardadas correctamente.",
      data: documento,
    });
  } catch (error) {
    console.error("Error al guardar anotaciones:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al guardar las anotaciones.",
      error: error.message,
    });
  }
}

export async function eliminarDocumento(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ ok: false, message: "Documento no válido." });
    }

    const documento = await eliminarDocumentoService(id);

    if (!documento) {
      return res
        .status(404)
        .json({ ok: false, message: "Documento no encontrado." });
    }

    return res.status(200).json({
      ok: true,
      message: "Documento eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al eliminar el documento.",
      error: error.message,
    });
  }
}
