import mongoose from "mongoose";
import {
  subirDocumentoService,
  obtenerDocumentosPorExpedienteService,
  obtenerDocumentoPorIdService,
  guardarAnotacionesService,
  eliminarDocumentoService,
} from "../services/DocumentoExpedienteService.js";

export async function subirDocumento(req, res) {
  try {
    const { id } = req.params; // expediente_id
    const { tipo, paciente_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ ok: false, message: "Expediente no válido." });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, message: "No se recibió ningún archivo." });
    }

    if (!paciente_id) {
      return res.status(400).json({ ok: false, message: "El paciente_id es obligatorio." });
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
      return res.status(404).json({ ok: false, message: "Expediente no válido." });
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
      return res.status(404).json({ ok: false, message: "Documento no encontrado." });
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
      return res.status(404).json({ ok: false, message: "Documento no encontrado." });
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
      return res.status(404).json({ ok: false, message: "Documento no válido." });
    }

    const documento = await guardarAnotacionesService(id, anotaciones);

    if (!documento) {
      return res.status(404).json({ ok: false, message: "Documento no encontrado." });
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
      return res.status(404).json({ ok: false, message: "Documento no válido." });
    }

    const documento = await eliminarDocumentoService(id);

    if (!documento) {
      return res.status(404).json({ ok: false, message: "Documento no encontrado." });
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