import mongoose from "mongoose";
import OdontogramaModel from "../../modelos/Odontograma/OdontogramaModel.js";
import HistorialModel from "../../modelos/Odontograma/HistorialModel.js";
import AccionesModel from "../../modelos/Odontograma/AccionesModel.js";

const USUARIO_TEMPORAL_ID = "6a0976766306e107cd5183d4";

function esObjectIdValido(id) {
	return mongoose.Types.ObjectId.isValid(id);
}

function convertirPiezasParaCliente(piezas = []) {
	const teeth = {};

	for (const pieza of piezas) {
		teeth[pieza.numero] = {
			marks: pieza.marks || [],
			observacion: pieza.observacion || "",
			historial: [],
		};
	}

	return teeth;
}

async function validarAccionesEventos(eventos = []) {
	const codigos = eventos
		.map((evento) => evento.accion_codigo)
		.filter((codigo) => codigo && codigo.trim() !== "");

	if (codigos.length === 0) return;

	const acciones = await AccionesModel.find({
		codigo: { $in: codigos },
		activo: true,
	}).lean();

	const codigosValidos = new Set(acciones.map((accion) => accion.codigo));

	for (const codigo of codigos) {
		if (!codigosValidos.has(codigo)) {
			throw new Error(`La acción '${codigo}' no existe o no está activa.`);
		}
	}
}

export async function obtenerOdontogramaPorPaciente(req, res) {
	try {
		const { pacienteId } = req.params;

		if (!esObjectIdValido(pacienteId)) {
			return res.status(400).json({
				ok: false,
				message: "El identificador del paciente no es válido.",
				data: null,
			});
		}

		const odontograma = await OdontogramaModel.findOne({
			paciente_id: pacienteId,
			activo: true,
		}).lean();

		if (!odontograma) {
			return res.status(200).json({
				ok: true,
				message: "El paciente no tiene odontograma registrado.",
				data: null,
			});
		}

		const historial = await HistorialModel.find({
			odontograma_id: odontograma._id,
			activo: true,
		})
			.sort({ createdAt: -1 })
			.lean();

		const historialPorPieza = historial.reduce((acc, item) => {
			const numero = item.pieza_numero;

			if (!acc[numero]) acc[numero] = [];

			acc[numero].push({
				fecha: item.createdAt,
				tipo: item.tipo_evento,
				detalle: item.detalle,
			});

			return acc;
		}, {});

		const teeth = convertirPiezasParaCliente(odontograma.piezas);

		for (const numero of Object.keys(teeth)) {
			teeth[numero].historial = historialPorPieza[numero] || [];
		}

		return res.status(200).json({
			ok: true,
			message: "Odontograma obtenido correctamente.",
			data: {
				_id: odontograma._id,
				paciente_id: odontograma.paciente_id,
				expediente_id: odontograma.expediente_id,
				dentadura: odontograma.dentadura,
				notas_generales: odontograma.notas_generales || "",
				teeth,
				createdAt: odontograma.createdAt,
				updatedAt: odontograma.updatedAt,
			},
		});
	} catch (error) {
		console.error("Error al obtener odontograma:", error);

		return res.status(500).json({
			ok: false,
			message: "Ocurrió un error al obtener el odontograma.",
			error: error.message,
		});
	}
}

export async function guardarOdontograma(req, res) {
	try {
		const {
			paciente_id,
			expediente_id,
			dentadura,
			piezas,
			notas_generales,
			eventos = [],
		} = req.body;

		if (!esObjectIdValido(paciente_id)) {
			return res.status(400).json({
				ok: false,
				message: "El paciente seleccionado no es válido.",
			});
		}

		if (!esObjectIdValido(expediente_id)) {
			return res.status(400).json({
				ok: false,
				message: "El expediente clínico no es válido o no fue enviado.",
			});
		}

		if (!Array.isArray(piezas) || piezas.length === 0) {
			return res.status(400).json({
				ok: false,
				message: "El odontograma debe contener piezas dentales.",
			});
		}

		await validarAccionesEventos(eventos);

		const usuarioId = USUARIO_TEMPORAL_ID;

		let odontograma = await OdontogramaModel.findOne({
			paciente_id,
			expediente_id,
			activo: true,
		});

		if (!odontograma) {
			odontograma = await OdontogramaModel.create({
				paciente_id,
				expediente_id,
				creado_por_id: usuarioId,
				actualizado_por_id: usuarioId,
				dentadura,
				piezas,
				notas_generales,
				activo: true,
			});
		} else {
			odontograma.dentadura = dentadura;
			odontograma.piezas = piezas;
			odontograma.notas_generales = notas_generales || "";
			odontograma.actualizado_por_id = usuarioId;

			await odontograma.save();
		}

		if (eventos.length > 0) {
			const historial = eventos.map((evento) => ({
				odontograma_id: odontograma._id,
				paciente_id,
				expediente_id,
				registrado_por_id: usuarioId,
				pieza_numero: evento.pieza_numero,
				tipo_evento: evento.tipo_evento,
				accion_codigo: evento.accion_codigo || "",
				accion_nombre: evento.accion_nombre || "",
				area: evento.area || "",
				detalle: evento.detalle,
				observacion: evento.observacion || "",
				activo: true,
			}));

			await HistorialModel.insertMany(historial);
		}

		return res.status(200).json({
			ok: true,
			message: "Odontograma guardado correctamente.",
			data: odontograma,
		});
	} catch (error) {
		console.error("Error al guardar odontograma:", error);

		return res.status(500).json({
			ok: false,
			message: "Ocurrió un error al guardar el odontograma.",
			error: error.message,
		});
	}
}

export async function obtenerHistorialOdontograma(req, res) {
	try {
		const { odontogramaId } = req.params;

		if (!esObjectIdValido(odontogramaId)) {
			return res.status(400).json({
				ok: false,
				message: "El identificador del odontograma no es válido.",
				data: [],
			});
		}

		const historial = await HistorialModel.find({
			odontograma_id: odontogramaId,
			activo: true,
		})
			.sort({ createdAt: -1 })
			.lean();

		return res.status(200).json({
			ok: true,
			message: "Historial obtenido correctamente.",
			data: historial,
		});
	} catch (error) {
		console.error("Error al obtener historial:", error);

		return res.status(500).json({
			ok: false,
			message: "Ocurrió un error al obtener el historial.",
			error: error.message,
		});
	}
}