import {
  obtenerMarcasService,
  obtenerJornadaActivaService,
  iniciarJornadaService,
  finalizarJornadaService,
  crearMarcaManualService,
  justificarMarcaService,
  aprobarMarcaService,
  rechazarMarcaService,
  obtenerMarcasPendientesService,
  obtenerResumenMarcasService,
} from "../services/MarcaService.js";

const ROL_VISIBILIDAD_TOTAL = "Dentista";

export async function obtenerMarcas(req, res) {
  try {
    const { fecha, usuario_id, estado } = req.query;
    const marcas = await obtenerMarcasService(req.user, { fecha, usuario_id, estado });

    return res.status(200).json({
      ok: true,
      message: "Marcas obtenidas correctamente.",
      data: marcas,
    });
  } catch (error) {
    console.error("Error al obtener marcas:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al obtener las marcas.",
      data: [],
      error: error.message,
    });
  }
}

export async function obtenerResumenMarcas(req, res) {
  try {
    const resumen = await obtenerResumenMarcasService(req.user);

    return res.status(200).json({
      ok: true,
      message: "Resumen obtenido correctamente.",
      data: resumen,
    });
  } catch (error) {
    console.error("Error al obtener el resumen de marcas:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al obtener el resumen.",
      error: error.message,
    });
  }
}

export async function obtenerJornadaActiva(req, res) {
  try {
    const jornada = await obtenerJornadaActivaService(req.user);

    return res.status(200).json({
      ok: true,
      message: "Jornada activa obtenida correctamente.",
      data: jornada,
    });
  } catch (error) {
    console.error("Error al obtener la jornada activa:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al obtener la jornada activa.",
      error: error.message,
    });
  }
}

export async function iniciarJornada(req, res) {
  try {
    const marca = await iniciarJornadaService(req.user);

    return res.status(201).json({
      ok: true,
      message: "Jornada iniciada correctamente.",
      data: marca,
    });
  } catch (error) {
    console.error("Error al iniciar jornada:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al iniciar la jornada.",
      error: error.message,
    });
  }
}

export async function finalizarJornada(req, res) {
  try {
    const marca = await finalizarJornadaService(req.user);

    return res.status(200).json({
      ok: true,
      message: "Jornada finalizada correctamente.",
      data: marca,
    });
  } catch (error) {
    console.error("Error al finalizar jornada:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al finalizar la jornada.",
      error: error.message,
    });
  }
}

export async function crearMarcaManual(req, res) {
  try {
    const { fecha, hora_entrada, hora_salida, observaciones } = req.body;

    if (!fecha || !hora_entrada || !hora_salida) {
      return res.status(400).json({
        ok: false,
        message: "Fecha, hora de entrada y hora de salida son obligatorias.",
      });
    }

    const marca = await crearMarcaManualService(req.user, req.body);

    return res.status(201).json({
      ok: true,
      message: "Marca manual registrada correctamente.",
      data: marca,
    });
  } catch (error) {
    console.error("Error al crear marca manual:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al registrar la marca manual.",
      error: error.message,
    });
  }
}

export async function justificarMarca(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({
        ok: false,
        message: "Debes indicar el motivo de la justificación.",
      });
    }

    const marca = await justificarMarcaService(req.user, id, req.body);

    return res.status(200).json({
      ok: true,
      message: "Justificación registrada, queda pendiente de aprobación.",
      data: marca,
    });
  } catch (error) {
    console.error("Error al justificar marca:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al justificar la marca.",
      error: error.message,
    });
  }
}

export async function aprobarMarca(req, res) {
  try {
    if (req.user.rol !== ROL_VISIBILIDAD_TOTAL) {
      return res.status(403).json({
        ok: false,
        message: "No tienes permisos para aprobar marcas.",
      });
    }

    const { id } = req.params;
    const { comentario } = req.body;

    const marca = await aprobarMarcaService(req.user, id, comentario);

    return res.status(200).json({
      ok: true,
      message: "Marca aprobada correctamente.",
      data: marca,
    });
  } catch (error) {
    console.error("Error al aprobar marca:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al aprobar la marca.",
      error: error.message,
    });
  }
}

export async function rechazarMarca(req, res) {
  try {
    if (req.user.rol !== ROL_VISIBILIDAD_TOTAL) {
      return res.status(403).json({
        ok: false,
        message: "No tienes permisos para rechazar marcas.",
      });
    }

    const { id } = req.params;
    const { comentario } = req.body;

    const marca = await rechazarMarcaService(req.user, id, comentario);

    return res.status(200).json({
      ok: true,
      message: "Marca rechazada correctamente.",
      data: marca,
    });
  } catch (error) {
    console.error("Error al rechazar marca:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al rechazar la marca.",
      error: error.message,
    });
  }
}

export async function obtenerMarcasPendientes(req, res) {
  try {
    if (req.user.rol !== ROL_VISIBILIDAD_TOTAL) {
      return res.status(403).json({
        ok: false,
        message: "No tienes permisos para ver las marcas pendientes.",
      });
    }

    const marcas = await obtenerMarcasPendientesService();

    return res.status(200).json({
      ok: true,
      message: "Marcas pendientes obtenidas correctamente.",
      data: marcas,
    });
  } catch (error) {
    console.error("Error al obtener marcas pendientes:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Ocurrió un error al obtener las marcas pendientes.",
      data: [],
      error: error.message,
    });
  }
}