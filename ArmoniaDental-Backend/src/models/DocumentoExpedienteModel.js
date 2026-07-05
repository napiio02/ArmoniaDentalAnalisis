import mongoose from "mongoose";

const TIPOS_DOCUMENTO = [
  "Radiografía",
  "Receta",
  "Consentimiento",
  "Resultado de laboratorio",
  "Otro",
];

const documentoExpedienteSchema = new mongoose.Schema(
  {
    expediente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expediente",
      required: true,
    },
    paciente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: TIPOS_DOCUMENTO,
      default: "Otro",
    },
    nombre_original: {
      type: String,
      required: true,
    },
    nombre_archivo: {
      type: String,
      required: true,
    },
    formato: {
      type: String,
      required: true,
      enum: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
    },
    tamano_bytes: {
      type: Number,
      required: true,
    },
    ruta_storage: {
      type: String,
      required: true,
    },
    anotaciones: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "fecha_subida", updatedAt: "updatedAt" },
    versionKey: false,
    collection: "documentos_expediente",
  }
);

export default mongoose.model("DocumentoExpediente", documentoExpedienteSchema);