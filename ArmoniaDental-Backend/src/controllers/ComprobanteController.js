import {
  crearComprobanteService,
  eliminarComprobanteFirmadoService,
  enviarComprobanteService,
  enviarWhatsappComprobanteService,
  obtenerArchivoComprobante,
  subirComprobanteFirmadoService,
  listarComprobantesService,
  obtenerComprobantePorIdService,
} from "../services/ComprobanteService.js";

const responderError = (res, error, mensajeDefault) => {
  console.error(mensajeDefault, error.message);

  const statusCode = error.statusCode || 500;
  const mensaje =
    error.statusCode && error.message
      ? error.message
      : mensajeDefault;

  return res.status(statusCode).json({
    ok: false,
    message: mensaje,
    data: null,
  });
};

export const listarComprobantes = async (req, res) => {
  try {
    const comprobantes = await listarComprobantesService(req.query);

    return res.status(200).json({
      ok: true,
      message: "Comprobantes obtenidos correctamente.",
      data: comprobantes,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al obtener los comprobantes."
    );
  }
};

export const obtenerComprobante = async (req, res) => {
  try {
    const comprobante = await obtenerComprobantePorIdService(
      req.params.id
    );

    return res.status(200).json({
      ok: true,
      message: "Comprobante obtenido correctamente.",
      data: comprobante,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al obtener el comprobante."
    );
  }
};

export const crearComprobante = async (req, res) => {
  try {
    const comprobante = await crearComprobanteService(
      req.body,
      req.user
    );

    return res.status(201).json({
      ok: true,
      message: "Comprobante creado correctamente.",
      data: comprobante,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al crear el comprobante."
    );
  }
};

export const descargarPdfComprobante = async (req, res) => {
  try {
    const comprobante = await obtenerComprobantePorIdService(
      req.params.id
    );
    // ?version=firmado → la versión firmada; por defecto, el PDF generado por el sistema (para firmarlo)
    const version = req.query.version === "firmado" ? "firmado" : "generado";
    const { buffer: pdfBuffer, nombre: nombreArchivo } = await obtenerArchivoComprobante(comprobante, version);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition":
        `attachment; filename="${nombreArchivo}"; ` +
        `filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al generar el PDF del comprobante."
    );
  }
};

export const enviarComprobante = async (req, res) => {
  try {
    const comprobante = await enviarComprobanteService(
      req.params.id,
      req.body?.correo_destino
    );

    return res.status(200).json({
      ok: true,
      message: "Comprobante enviado correctamente.",
      data: comprobante,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al enviar el comprobante."
    );
  }
};

export const subirComprobanteFirmado = async (req, res) => {
  try {
    const comprobante = await subirComprobanteFirmadoService(req.params.id, req.file, req.user);
    return res.status(200).json({ ok: true, message: "Comprobante firmado guardado correctamente.", data: comprobante });
  } catch (error) {
    return responderError(res, error, "Ocurrió un error al guardar el comprobante firmado.");
  }
};

export const eliminarComprobanteFirmado = async (req, res) => {
  try {
    const comprobante = await eliminarComprobanteFirmadoService(req.params.id);
    return res.status(200).json({ ok: true, message: "Se quitó la versión firmada.", data: comprobante });
  } catch (error) {
    return responderError(res, error, "Ocurrió un error al quitar la versión firmada.");
  }
};

export const enviarWhatsappComprobante = async (req, res) => {
  try {
    const comprobante = await enviarWhatsappComprobanteService(req.params.id, req.body?.telefono);
    return res.status(200).json({ ok: true, message: "Comprobante enviado por WhatsApp.", data: comprobante });
  } catch (error) {
    return responderError(res, error, "Ocurrió un error al enviar el comprobante por WhatsApp.");
  }
};
