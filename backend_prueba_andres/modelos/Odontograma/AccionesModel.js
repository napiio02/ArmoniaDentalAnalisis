import mongoose from "mongoose";

const accionesSchema = new mongoose.Schema(
	{
		codigo: {
			type: String,
			required: true,
			unique: true,
			index: true,
			trim: true,
			lowercase: true,
		},
		nombre: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		grupo: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		color: {
			type: String,
			required: true,
			trim: true,
			match: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
		},
		abreviatura: {
			type: String,
			required: true,
			trim: true,
			uppercase: true,
			maxlength: 10,
		},
		tipo_render: {
			type: String,
			required: true,
			enum: ["shape", "whole", "faces", "label"],
			trim: true,
		},
		grupo_exclusivo: {
			type: String,
			default: "",
			trim: true,
		},
		activo: {
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{
		timestamps: true,
		collection: "odontograma_acciones",
	}
);

const AccionesModel = mongoose.model("OdontogramaAcciones", accionesSchema);

export default AccionesModel;