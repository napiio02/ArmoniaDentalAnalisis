import mongoose from "mongoose";

const expedienteSchema = new mongoose.Schema(
  {
    paciente_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "Paciente",
    },
    fecha: {
      type: Date,
      default: null,
    },
    tipo: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1500,
    },
    tratamiento: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1500,
    },
    proximo_control: {
      type: Date,
      default: null,
    },
    adjuntos: {
      type: [String],
      default: [],
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "expedientes",
  }
);

expedienteSchema.index({ paciente_id: 1, activo: 1 });

const ExpedienteModel = mongoose.model("Expediente", expedienteSchema);

export default ExpedienteModel; 