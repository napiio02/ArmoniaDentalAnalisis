import {
  crearComprobanteService,
  enviarComprobanteService,
  generarPdfComprobanteService,
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
    const pdfBuffer = await generarPdfComprobanteService(comprobante);
    const nombreArchivo = `${comprobante.numero}.pdf`;

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
