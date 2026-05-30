import {
  obtenerOdontogramaPorPacienteService,
  guardarOdontogramaService,
  obtenerHistorialOdontogramaService,
} from "../../services/Odontograma/OdontogramaService.js";

function responderError(res, error, mensajeDefault) {
  console.error(mensajeDefault, error);

  return res.status(error.statusCode || 500).json({
    ok: false,
    message: error.message || mensajeDefault,
    data: null,
  });
}

function convertirPiezasParaCliente(piezas = []) {
  const teeth = {};

  for (const pieza of piezas) {
    teeth[pieza.numero] = {
      marks: pieza.marks || [],
      observacion: pieza.observacion || "",
      historial: [],
    };
  }

  return teeth;
}

function unirHistorialConPiezas(piezas = [], historial = []) {
  const teeth = convertirPiezasParaCliente(piezas);

  const historialPorPieza = historial.reduce((acc, item) => {
    const numero = item.pieza_numero;

    if (!acc[numero]) acc[numero] = [];

    acc[numero].push({
      fecha: item.createdAt,
      tipo: item.tipo_evento,
      detalle: item.detalle,
      accion_codigo: item.accion_codigo || "",
      accion_nombre: item.accion_nombre || "",
      area: item.area || "",
      observacion: item.observacion || "",
    });

    return acc;
  }, {});

  for (const numero of Object.keys(teeth)) {
    teeth[numero].historial = historialPorPieza[numero] || [];
  }

  return teeth;
}

export async function obtenerOdontogramaPorPaciente(req, res) {
  try {
    const { pacienteId } = req.params;

    const odontograma = await obtenerOdontogramaPorPacienteService(pacienteId);

    if (!odontograma) {
      return res.status(200).json({
        ok: true,
        message: "El paciente no tiene odontograma registrado.",
        data: null,
      });
    }

    const teeth = unirHistorialConPiezas(
      odontograma.piezas || [],
      odontograma.historial || []
    );

    return res.status(200).json({
      ok: true,
      message: "Odontograma obtenido correctamente.",
      data: {
        _id: odontograma._id,
        paciente_id: odontograma.paciente_id,
        expediente_id: odontograma.expediente_id,
        paciente: odontograma.paciente || null,
        dentadura: odontograma.dentadura,
        notas_generales: odontograma.notas_generales || "",
        teeth,
        historial: odontograma.historial || [],
        createdAt: odontograma.createdAt,
        updatedAt: odontograma.updatedAt,
      },
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al obtener el odontograma."
    );
  }
}

export async function guardarOdontograma(req, res) {
  try {
    const usuarioTemporalId = process.env.USUARIO_TEMPORAL_ID;

    const payload = {
      ...req.body,

      // Cuando exista login real, lo ideal sería:
      // usuario_id: req.user?._id,
      usuario_id: req.user?._id || usuarioTemporalId || req.body.usuario_id,
    };

    const odontograma = await guardarOdontogramaService(payload);

    return res.status(200).json({
      ok: true,
      message: "Odontograma guardado correctamente.",
      data: odontograma,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al guardar el odontograma."
    );
  }
}

export async function obtenerHistorialOdontograma(req, res) {
  try {
    const { odontogramaId } = req.params;

    const historial = await obtenerHistorialOdontogramaService(odontogramaId);

    return res.status(200).json({
      ok: true,
      message: "Historial obtenido correctamente.",
      data: historial,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al obtener el historial del odontograma."
    );
  }
}