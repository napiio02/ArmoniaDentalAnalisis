import jwt from "jsonwebtoken";

import Usuario from "../models/Usuario.js";

const COOKIE_NAME = "auth_token";

const obtenerToken = (req) => {
  // Token guardado en la cookie HttpOnly
  const tokenCookie = req.cookies?.[COOKIE_NAME];

  if (tokenCookie) {
    return tokenCookie;
  }

  // Alternativa útil para Postman o Thunder Client:
  // Authorization: Bearer TOKEN
  const authorization = req.headers.authorization;

  if (
    authorization &&
    authorization.startsWith("Bearer ")
  ) {
    return authorization.split(" ")[1];
  }

  return null;
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = obtenerToken(req);

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "No se encontró una sesión activa. Debe iniciar sesión.",
        data: null,
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "No se encontró JWT_SECRET en las variables de entorno."
      );

      return res.status(500).json({
        ok: false,
        message: "Error en la configuración de autenticación.",
        data: null,
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const usuario = await Usuario.findById(decoded.userId)
      .populate("rol_id", "nombre activo");

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        message: "El usuario asociado a la sesión ya no existe.",
        data: null,
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        ok: false,
        message: "La cuenta se encuentra deshabilitada.",
        data: null,
      });
    }

    if (usuario.estado_cuenta !== "Activa") {
      return res.status(403).json({
        ok: false,
        message: "La cuenta no se encuentra activa.",
        data: null,
      });
    }

    if (!usuario.rol_id) {
      return res.status(403).json({
        ok: false,
        message: "El usuario no tiene un rol válido asignado.",
        data: null,
      });
    }

    if (!usuario.rol_id.activo) {
      return res.status(403).json({
        ok: false,
        message: "El rol asignado al usuario está deshabilitado.",
        data: null,
      });
    }

    /*
     * Información disponible para los controladores protegidos.
     *
     * Por ejemplo:
     * req.user._id
     * req.user.email
     * req.user.rol
     */
    req.user = {
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol_id.nombre,
      rol_id: usuario.rol_id._id,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        message: "La sesión expiró. Debe iniciar sesión nuevamente.",
        data: null,
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        ok: false,
        message: "La sesión no es válida.",
        data: null,
      });
    }

    console.error("Error verificando la sesión:", error);

    return res.status(500).json({
      ok: false,
      message: "Ocurrió un error al verificar la sesión.",
      data: null,
    });
  }
};