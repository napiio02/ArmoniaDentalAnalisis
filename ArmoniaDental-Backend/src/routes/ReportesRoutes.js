import { obtenerReporte } from "../controllers/ReporteController.js";
import { verifyToken } from "../middlewares/VerifyToken.js";

export const ReportesRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/reportes/resumen`, verifyToken, obtenerReporte);
};
