import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import Sesion from "../models/Sesion.js";

export const crearSesion = async (usuario) => {
  if (!process.env.JWT_SECRET) throw new Error("Falta JWT_SECRET.");
  const sid = crypto.randomUUID();
  const version = usuario.session_version ?? 0;
  const token = jwt.sign({ userId: String(usuario._id), sid, version }, process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
  const expires_at = new Date(jwt.decode(token).exp * 1000);
  const datos = { sid, usuario_id: usuario._id, version, expires_at, revoked_at: null };
  if (usuario.rol_id.nombre === "Admin") {
    try {
      // Upsert condicionado + _id único: dos logins concurrentes no pueden ganar.
      await Sesion.findOneAndUpdate({ _id: `admin:${usuario._id}`, $or: [
        { expires_at: { $lte: new Date() } }, { revoked_at: { $ne: null } }, { version: { $lt: version } },
      ] }, { $set: datos }, { upsert: true, new: true, runValidators: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const conflicto = new Error("Ya existe una sesión administrativa activa. Cierre esa sesión o espere a que expire.");
      conflicto.statusCode = 409;
      throw conflicto;
    }
  } else {
    await Sesion.create({ _id: sid, ...datos });
  }
  return { token, sid, expires_at };
};
export const revocarSesion = (sid) => Sesion.updateOne(
  { sid, revoked_at: null }, { $set: { revoked_at: new Date() } });
export const revocarSesionesUsuario = (usuario_id) => Sesion.updateMany(
  { usuario_id, revoked_at: null }, { $set: { revoked_at: new Date() } });
