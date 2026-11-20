import {
  listarProcedimientosService,
  crearProcedimientoService,
  actualizarProcedimientoService,
  anularProcedimientoService,
  registrarAbonoService,
  anularAbonoService,
} from "../services/ProcedimientoService.js";

// Respuesta común: errores de validación (400), no encontrado (404) o conflicto (409) con su mensaje
const responder = (accion, status = 200, mensaje) => async (req, res) => {
  try {
    const data = await accion(req);
    return res.status(status).json({ ok: true, message: mensaje, data });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ ok: false, message: "Algunos datos no son válidos.", error: error.message });
    }
    if (error.status) return res.status(error.status).json({ ok: false, message: error.message });
    console.error("Error en procedimientos:", error);
    return res.status(500).json({ ok: false, message: "Ocurrió un error al procesar la solicitud." });
  }
};

export const listarProcedimientos = responder(
  (req) => listarProcedimientosService(req.params.paciente_id),
  200,
  "Procedimientos obtenidos correctamente."
);

export const crearProcedimiento = responder(
  (req) => crearProcedimientoService(req.params.paciente_id, req.body, req.user),
  201,
  "Procedimiento registrado correctamente."
);

export const actualizarProcedimiento = responder(
  (req) => actualizarProcedimientoService(req.params.id, req.body, req.user),
  200,
  "Procedimiento actualizado correctamente."
);

export const anularProcedimiento = responder(
  (req) => anularProcedimientoService(req.params.id, req.body?.motivo, req.user),
  200,
  "Procedimiento anulado."
);

export const registrarAbono = responder(
  (req) => registrarAbonoService(req.params.id, req.body, req.user),
  201,
  "Abono registrado correctamente."
);

export const anularAbono = responder(
  (req) => anularAbonoService(req.params.id, req.params.abono_id, req.body?.motivo, req.user),
  200,
  "Abono anulado."
);
