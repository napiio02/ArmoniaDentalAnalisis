import mongoose from "mongoose";

/*
 * Procedimientos del paciente con su costo y los abonos que va realizando.
 * Por tratarse de dinero, nada se borra: procedimientos y abonos se ANULAN con motivo,
 * y queda registrado quién lo hizo. El saldo no se guarda, se calcula a partir de los abonos.
 */

export const METODOS_PAGO = ["Efectivo", "SINPE Móvil", "Tarjeta", "Transferencia", "Otro"];

const usuarioRef = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    nombre: { type: String, default: "" },
  },
  { _id: false }
);

const abonoSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // AAAA-MM-DD (Costa Rica)
    monto: { type: Number, required: true, min: 0.01 },
    metodo: { type: String, enum: METODOS_PAGO, default: "Efectivo" },
    nota: { type: String, trim: true, default: "", maxlength: 300 },
    registrado_por: { type: usuarioRef, default: null },
    registrado_en: { type: Date, default: Date.now },
    anulado: { type: Boolean, default: false },
    motivo_anulacion: { type: String, trim: true, default: "", maxlength: 300 },
    anulado_por: { type: usuarioRef, default: null },
    anulado_en: { type: Date, default: null },
  },
  { _id: true }
);

const procedimientoSchema = new mongoose.Schema(
  {
    paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: "Paciente", required: true, index: true },
    fecha: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // AAAA-MM-DD (Costa Rica)
    procedimiento: { type: String, trim: true, required: true, maxlength: 200 },
    pieza: { type: String, trim: true, default: "", maxlength: 60 }, // ej. "16" o "14 a 16" (opcional)
    notas: { type: String, trim: true, default: "", maxlength: 500 },
    monto: { type: Number, required: true, min: 0.01 },
    abonos: { type: [abonoSchema], default: [] },
    anulado: { type: Boolean, default: false },
    motivo_anulacion: { type: String, trim: true, default: "", maxlength: 300 },
    anulado_por: { type: usuarioRef, default: null },
    anulado_en: { type: Date, default: null },
    creado_por: { type: usuarioRef, default: null },
    actualizado_por: { type: usuarioRef, default: null },
  },
  { timestamps: true, collection: "procedimientos" }
);

procedimientoSchema.index({ paciente_id: 1, fecha: -1 });

export default mongoose.model("Procedimiento", procedimientoSchema);
