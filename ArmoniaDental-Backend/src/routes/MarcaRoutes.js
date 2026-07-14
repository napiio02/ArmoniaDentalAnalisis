import {
  obtenerMarcas,
  obtenerResumenMarcas,
  obtenerJornadaActiva,
  iniciarJornada,
  finalizarJornada,
  crearMarcaManual,
  justificarMarca,
  aprobarMarca,
  rechazarMarca,
  obtenerMarcasPendientes,
} from "../controllers/MarcaController.js";
import { verifyToken } from "../middlewares/VerifyToken.js";

export const MarcaRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/marcas`, verifyToken, obtenerMarcas);
  app.get(`/${version}/marcas/resumen`, verifyToken, obtenerResumenMarcas);
  app.get(`/${version}/marcas/jornada-activa`, verifyToken, obtenerJornadaActiva);
  app.get(`/${version}/marcas/pendientes`, verifyToken, obtenerMarcasPendientes);

  app.post(`/${version}/marcas/iniciar`, verifyToken, iniciarJornada);
  app.post(`/${version}/marcas/finalizar`, verifyToken, finalizarJornada);
  app.post(`/${version}/marcas/manual`, verifyToken, crearMarcaManual);
  app.post(`/${version}/marcas/:id/justificar`, verifyToken, justificarMarca);

  app.patch(`/${version}/marcas/:id/aprobar`, verifyToken, aprobarMarca);
  app.patch(`/${version}/marcas/:id/rechazar`, verifyToken, rechazarMarca);
};