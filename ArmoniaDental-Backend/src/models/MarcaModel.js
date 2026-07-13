import mongoose from "mongoose";

const { Schema } = mongoose;

export const ESTADOS_MARCA = [
  "En curso", 
  "Completa", 
  "Pendiente aprobación",
  "Justificada pendiente", 
  "Rechazada", 
];

const JustificacionSchema = new Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: [
        "Olvidó marcar entrada",
        "Olvidó marcar salida",
        "Corrección de marca",
        "Problema técnico",
        "Permiso administrativo",
        "Atención de emergencia",
        "Marca manual",
        "Otro",
      ],
    },
    hora_sugerida: { type: String, default: "" },
    motivo: { type: String, required: true, trim: true },
    fecha: { type: Date, default: Date.now },
    revisado_por: { type: Schema.Types.ObjectId, ref: "Usuario", default: null },
    revisado_at: { type: Date, default: null },
    comentario_revision: { type: String, default: "" },
  },
  { _id: false }
);

const MarcaSchema = new Schema(
  {
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      index: true,
    },
    creado_por: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    fecha: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    inicio_at: { type: Date, default: null },
    fin_at: { type: Date, default: null },
    hora_entrada: { type: String, default: "" },
    hora_salida: { type: String, default: "" },
    horas_trabajadas: { type: Number, default: 0, min: 0 },
    observaciones: { type: String, default: "", trim: true },
    estado: { type: String, enum: ESTADOS_MARCA, default: "En curso", index: true },
    tipo_registro: {
      type: String,
      enum: ["Automático", "Manual"],
      default: "Automático",
    },
    justificacion: { type: JustificacionSchema, default: null },
  },
  { timestamps: true }
);

// Evita que un mismo usuario tenga dos jornadas "En curso" al mismo tiempo.
MarcaSchema.index(
  { usuario_id: 1, estado: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: "En curso" },
  }
);

const MarcaModel = mongoose.model("Marca", MarcaSchema);

export default MarcaModel;