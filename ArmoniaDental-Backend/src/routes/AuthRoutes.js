import {
  registrarAsistente,
  login,
  logout,
  obtenerSesion,
} from "../controllers/AuthController.js";

import { verifyToken } from "../middlewares/verifyToken.js";

export const AuthRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  // Rutas públicas
  app.post(`/${version}/auth/registro`, registrarAsistente);
  app.post(`/${version}/auth/login`, login);
  app.post(`/${version}/auth/logout`, logout);

  // Ruta protegida
  app.get(`/${version}/auth/me`, verifyToken, obtenerSesion);
};