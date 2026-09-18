import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import {
  registrarAsistente,
  login,
  logout,
  obtenerSesion,
  solicitarRecuperacion,
  restablecerContrasena,
} from "../controllers/AuthController.js";

import { verifyToken } from "../middlewares/VerifyToken.js";

export const AuthRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  // El registro de cuentas existentes solo puede completarlo Administración.
  // Login y logout son públicos (logout es idempotente).
  app.post(`/${version}/auth/registro`, verifyToken, autorizarRoles("Admin"), registrarAsistente);
  app.post(`/${version}/auth/login`, login);
  app.post(`/${version}/auth/logout`, logout);

  // Rutas públicas de recuperación de contraseña
  app.post(
    `/${version}/auth/recuperar-password`,
    solicitarRecuperacion
  );

  app.post(
    `/${version}/auth/restablecer-password`,
    restablecerContrasena
  );

  // Ruta protegida para consultar la sesión actual
  app.get(
    `/${version}/auth/me`,
    verifyToken,
    obtenerSesion
  );
};