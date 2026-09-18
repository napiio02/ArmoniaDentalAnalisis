import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";
import Sesion from "../models/Sesion.js";
export const obtenerToken = (req) => req.cookies?.auth_token ||
  (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
const invalidar = (res, message = "La sesión dejó de ser válida. Debe iniciar sesión nuevamente.") =>
  res.status(401).json({ ok: false, code: "SESSION_INVALID", message, data: null });
export const verifyToken = async (req, res, next) => {
  try {
    const token = obtenerToken(req);
    if (!token) return invalidar(res);
    if (!process.env.JWT_SECRET) throw new Error("Falta JWT_SECRET.");
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    // JWT anteriores a las sesiones persistentes se rechazan deliberadamente.
    if (!decoded.sid || !Number.isInteger(decoded.version) || !mongoose.isObjectIdOrHexString(decoded.userId)) return invalidar(res);
    const [usuario, sesion] = await Promise.all([
      Usuario.findById(decoded.userId).populate("rol_id", "nombre activo"),
      Sesion.findOne({ sid: decoded.sid, usuario_id: decoded.userId, revoked_at: null, expires_at: { $gt: new Date() } }),
    ]);
    if (!usuario || !sesion || !usuario.activo || usuario.estado_cuenta !== "Activa" ||
      !usuario.rol_id?.activo || !["Admin", "Dentista", "Asistente Dental"].includes(usuario.rol_id.nombre) ||
      decoded.version !== (usuario.session_version ?? 0) || sesion.version !== decoded.version) return invalidar(res);
    req.sessionId = decoded.sid;
    req.user = { _id: usuario._id, nombre: usuario.nombre, email: usuario.email,
      rol: usuario.rol_id.nombre, rol_id: usuario.rol_id._id, activo: true, estado_cuenta: "Activa" };
    res.set("Cache-Control", "no-store");
    next();
  } catch (error) {
    if (["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"].includes(error.name)) return invalidar(res);
    console.error("Error verificando la sesión:", error);
    res.status(503).json({ ok: false, code: "AUTH_UNAVAILABLE", message: "No fue posible validar la sesión. Intente nuevamente.", data: null });
  }
};
