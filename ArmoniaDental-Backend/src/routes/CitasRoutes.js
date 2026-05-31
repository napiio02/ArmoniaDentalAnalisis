import {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  cancelarCita,
} from "../controllers/CitasController.js";



export const CitasRoutes = (app) => { 
  app.get("/api/citas", getCitas);
  app.get("/api/citas/:id", getCitaById);
  app.post("/api/citas", createCita);
  app.put("/api/citas/:id", updateCita);
  app.patch("/api/citas/:id/cancelar", cancelarCita);
};
