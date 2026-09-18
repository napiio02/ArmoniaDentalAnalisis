import { verifyToken } from "../../middlewares/VerifyToken.js";
import {
  obtenerOdontogramaPorPaciente,
  guardarOdontograma,
  obtenerHistorialOdontograma,
} from "../../controllers/Odontograma/OdontogramaController.js";

export const OdontogramaRoutes = (app) => {
  app.get("/api/odontogramas/paciente/:pacienteId", verifyToken, obtenerOdontogramaPorPaciente);

  app.post("/api/odontogramas", verifyToken, guardarOdontograma);

  app.get("/api/odontogramas/:odontogramaId/historial", verifyToken, obtenerHistorialOdontograma);
};