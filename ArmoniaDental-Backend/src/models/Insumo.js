import mongoose from "mongoose";

const insumoSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    categoria: {
      type: String,
      required: true,
      enum: [
        "Protección",
        "Anestesia",
        "Materiales restaurativos",
        "Cirugía",
        "Instrumental",
        "Prevención",
        "Ortodoncia",
        "Diagnóstico",
      ],
    },
    stock_actual: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    stock_minimo: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    unidad: {
      type: String,
      required: true,
    },
    proveedor: {
      type: String,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

export default mongoose.model("Insumo", insumoSchema);