import {
  obtenerOdontogramaPorPaciente,
  guardarOdontograma,
  obtenerHistorialOdontograma,
} from "../../controllers/Odontograma/OdontogramaController.js";

export const OdontogramaRoutes = (app) => {
  app.get("/api/odontogramas/paciente/:pacienteId", obtenerOdontogramaPorPaciente);

  app.post("/api/odontogramas", guardarOdontograma);

  app.get("/api/odontogramas/:odontogramaId/historial", obtenerHistorialOdontograma);
};