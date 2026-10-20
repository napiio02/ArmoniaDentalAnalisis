import {
  obtenerConfiguracionAgenda,
  actualizarConfiguracionAgenda,
} from "../services/ConfiguracionAgendaService.js";

const responderError = (res, error, mensajeDefault) => {
  console.error(mensajeDefault, error);

  if (error.name === "ValidationError") {
    return res.status(400).json({ ok: false, message: error.message });
  }

  return res.status(error.statusCode || 500).json({
    ok: false,
    message: error.statusCode ? error.message : mensajeDefault,
  });
};

export const getConfiguracionAgenda = async (req, res) => {
  try {
    const configuracion = await obtenerConfiguracionAgenda();
    return res.status(200).json({ ok: true, data: configuracion });
  } catch (error) {
    return responderError(res, error, "No se pudo obtener la configuración de la agenda.");
  }
};

export const updateConfiguracionAgenda = async (req, res) => {
  try {
    const { configuracion, citasAfectadas } = await actualizarConfiguracionAgenda(req.body ?? {});
    return res.status(200).json({
      ok: true,
      message: "Configuración de la agenda actualizada correctamente.",
      data: configuracion,
      citasAfectadas,
    });
  } catch (error) {
    return responderError(res, error, "No se pudo actualizar la configuración de la agenda.");
  }
};
