import mongoose from "mongoose";

const movimientoInsumoSchema = new mongoose.Schema(
  {
    insumo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Insumo",
      required: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: ["entrada", "salida", "ajuste"],
      default: "entrada",
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },
    fecha: {
      type: Date,
      required: true,
    },
    stock_resultante: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export default mongoose.model("MovimientoInsumo", movimientoInsumoSchema, "movimientos_insumos");