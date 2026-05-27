import express from "express";

import {
	obtenerOdontogramaPorPaciente,
	guardarOdontograma,
	obtenerHistorialOdontograma,
} from "../../controladores/Odontograma/OdontogramaController.js";

const router = express.Router();

router.get("/paciente/:pacienteId", obtenerOdontogramaPorPaciente);

router.post("/", guardarOdontograma);

router.get("/:odontogramaId/historial", obtenerHistorialOdontograma);

export default router;