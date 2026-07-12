import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./database/DatabaseConnection.js";

import { UsersRoutes } from "./routes/UsuariosRoutes.js";
import { RolesRoutes } from "./routes/RolesRoutes.js";
import { InsumosRoutes } from "./routes/InsumosRoutes.js";
import { OdontogramaRoutes } from "./routes/Odontograma/OdontogramaRoutes.js";
import { PacientesRoutes } from "./routes/PacientesRoutes.js";
import { CitasRoutes } from "./routes/CitasRoutes.js"; 
import { AuthRoutes } from "./routes/AuthRoutes.js";
import { DocumentosExpedienteRoutes } from "./routes/DocumentosExpedienteRoutes.js";
import { ExpedientesRoutes } from "./routes/ExpedientesRoutes.js";
import { HistoriaClinicaRoutes } from "./routes/HistoriaClinicaRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

AuthRoutes(app);
UsersRoutes(app);
RolesRoutes(app);
InsumosRoutes(app);
OdontogramaRoutes(app);
PacientesRoutes(app);
CitasRoutes(app);
DocumentosExpedienteRoutes(app);
ExpedientesRoutes(app);
HistoriaClinicaRoutes(app);


app.get("/", (req, res) => {
  res.json({
    message: "API de Armonía Dental funcionando correctamente",
    version: process.env.VERSION || "v1",
  });
});

app.listen(port, async () => {
  try {
    //* Conectar Mongo Atlas
    await connectDB();

    console.log(`Server started on port ${port}`);
  } catch (error) {
    console.error("Error iniciando el servidor:", error.message);
    process.exit(1);
  }
});

export default app;