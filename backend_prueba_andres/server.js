import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import odontogramaRoutes from "./rutas/Odontograma/OdontogramaRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
);

app.use(express.json());

app.use("/api/odontogramas", odontogramaRoutes);

app.get("/", (req, res) => {
	res.json({
		message: "API de Armonía Dental funcionando correctamente",
	});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
});