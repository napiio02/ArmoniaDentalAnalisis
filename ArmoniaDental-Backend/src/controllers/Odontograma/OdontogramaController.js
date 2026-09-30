import {
  obtenerOdontogramasPorPacienteService,
  obtenerAccionesOdontogramaService,
  guardarOdontogramaService,
  obtenerHistorialOdontogramaService,
} from "../../services/Odontograma/OdontogramaService.js";

function responderError(res, error, mensajeDefault) {
  console.error(mensajeDefault, error);
  return res.status(error.statusCode || 500).json({
    ok: false,
    code: error.code || "ODONTOGRAM_ERROR",
    message: error.message || mensajeDefault,
    data: null,
  });
}

function convertirHistorial(historial = []) {
  return historial.map((item) => ({
    _id: item._id,
    fecha: item.createdAt,
    tipo: item.tipo_evento,
    detalle: item.detalle,
    accion_codigo: item.accion_codigo || "",
    accion_nombre: item.accion_nombre || "",
    area: item.area || "",
    observacion: item.observacion || "",
    ambito: item.ambito || "pieza",
    pieza_numero: item.pieza_numero ?? null,
    usuario: item.registrado_por_id?.nombre || "Usuario no disponible",
  }));
}

function convertirOdontograma(odontograma) {
  if (!odontograma) return null;
  const historial = convertirHistorial(odontograma.historial || []);
  const historialPorPieza = new Map();
  for (const item of historial) {
    if (item.ambito === "general" || item.pieza_numero == null) continue;
    const lista = historialPorPieza.get(item.pieza_numero) || [];
    lista.push(item);
    historialPorPieza.set(item.pieza_numero, lista);
  }
  const teeth = {};
  for (const pieza of odontograma.piezas || []) {
    teeth[pieza.numero] = {
      marks: pieza.marks || [],
      observacion: pieza.observacion || "",
      historial: historialPorPieza.get(pieza.numero) || [],
    };
  }
  return {
    _id: odontograma._id,
    paciente_id: odontograma.paciente_id,
    expediente_id: odontograma.expediente_id,
    dentadura: odontograma.dentadura,
    notas_generales: odontograma.notas_generales || "",
    teeth,
    historial,
    historial_general: historial.filter((item) => item.ambito === "general"),
    version: odontograma.__v,
    createdAt: odontograma.createdAt,
    updatedAt: odontograma.updatedAt,
  };
}

export async function obtenerOdontogramaPorPaciente(req, res) {
  try {
    const resultado = await obtenerOdontogramasPorPacienteService(
      req.params.pacienteId,
      req.query.expediente_id,
    );
    return res.status(200).json({
      ok: true,
      message: "Odontogramas obtenidos correctamente.",
      data: {
        paciente: resultado.paciente,
        expediente_id: resultado.expediente_id,
        odontogramas: {
          permanente: convertirOdontograma(resultado.odontogramas.permanente),
          temporal: convertirOdontograma(resultado.odontogramas.temporal),
        },
      },
    });
  } catch (error) {
    return responderError(res, error, "Ocurrió un error al obtener el odontograma.");
  }
}

export async function obtenerAccionesOdontograma(req, res) {
  try {
    return res.status(200).json({
      ok: true,
      message: "Acciones del odontograma obtenidas correctamente.",
      data: await obtenerAccionesOdontogramaService(),
    });
  } catch (error) {
    return responderError(res, error, "Ocurrió un error al obtener las acciones del odontograma.");
  }
}

export async function guardarOdontograma(req, res) {
  try {
    const odontograma = await guardarOdontogramaService({
      ...req.body,
      usuario_id: req.user._id,
    });
    return res.status(200).json({
      ok: true,
      message: "Odontograma guardado correctamente.",
      data: convertirOdontograma(odontograma),
    });
  } catch (error) {
    return responderError(res, error, "Ocurrió un error al guardar el odontograma.");
  }
}

export async function obtenerHistorialOdontograma(req, res) {
  try {
    const historial = await obtenerHistorialOdontogramaService(req.params.odontogramaId);
    return res.status(200).json({
      ok: true,
      message: "Historial obtenido correctamente.",
      data: convertirHistorial(historial),
    });
  } catch (error) {
    return responderError(res, error, "Ocurrió un error al obtener el historial del odontograma.");
  }
}
