import mongoose from "mongoose";

const historialSchema = new mongoose.Schema(
	{
		odontograma_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true,
			ref: "Odontograma",
		},
		paciente_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		expediente_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		registrado_por_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		pieza_numero: {
			type: Number,
			required: true,
		},
		tipo_evento: {
			type: String,
			required: true,
			trim: true,
			enum: ["Registro", "Actualización", "Observación"],
		},
		accion_codigo: {
			type: String,
			default: "",
			trim: true,
		},
		accion_nombre: {
			type: String,
			default: "",
			trim: true,
		},
		area: {
			type: String,
			default: "",
			trim: true,
		},
		detalle: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1500,
		},
		observacion: {
			type: String,
			default: "",
			trim: true,
			maxlength: 1500,
		},
		activo: {
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{
		timestamps: true,
		collection: "odontograma_historial",
	}
);

const HistorialModel = mongoose.model("OdontogramaHistorial", historialSchema);

export default HistorialModel;