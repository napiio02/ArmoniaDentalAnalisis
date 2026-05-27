import mongoose from "mongoose";

const odontogramaPiezaSchema = new mongoose.Schema(
	{
		numero: {
			type: Number,
			required: true,
		},
		marks: [
			{
				actionId: {
					type: String,
					required: true,
					trim: true,
				},
				area: {
					type: String,
					default: "",
					trim: true,
				},
			},
		],
		observacion: {
			type: String,
			default: "",
			trim: true,
			maxlength: 1000,
		},
	},
	{ _id: false }
);

const odontogramaSchema = new mongoose.Schema(
	{
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
		creado_por_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		actualizado_por_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		dentadura: {
			type: String,
			enum: ["permanente", "temporal"],
			default: "permanente",
		},
		piezas: {
			type: [odontogramaPiezaSchema],
			default: [],
		},
		notas_generales: {
			type: String,
			default: "",
			trim: true,
			maxlength: 2000,
		},
		activo: {
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{
		timestamps: true,
		collection: "odontogramas",
	}
);

odontogramaSchema.index(
	{ paciente_id: 1, expediente_id: 1, activo: 1 },
	{ unique: true, partialFilterExpression: { activo: true } }
);

const OdontogramaModel = mongoose.model("Odontograma", odontogramaSchema);

export default OdontogramaModel;