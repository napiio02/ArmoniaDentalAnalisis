import mongoose from "mongoose";

/*
 * PDF del comprobante firmado con firma digital por el profesional.
 * Se guarda en la base de datos (no en el disco del servidor), porque en Render
 * el disco se borra en cada despliegue o reinicio. Uno por comprobante.
 */
const comprobanteFirmadoSchema = new mongoose.Schema(
  {
    comprobante_id: { type: mongoose.Schema.Types.ObjectId, ref: "Comprobante", required: true, unique: true },
    archivo: { type: Buffer, required: true },
    nombre_original: { type: String, trim: true, default: "", maxlength: 200 },
    tamano: { type: Number, required: true },
    sha256: { type: String, required: true },
    subido_por: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
      nombre: { type: String, default: "" },
    },
  },
  { timestamps: true, collection: "comprobantes_firmados" }
);

export default mongoose.model("ComprobanteFirmado", comprobanteFirmadoSchema);
