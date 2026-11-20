import mongoose from "mongoose";

export const TIPOS_COMPROBANTE = [
  "Incapacidad",
  "Justificación laboral",
];

export const ESTADOS_ENVIO_COMPROBANTE = [
  "pendiente",
  "enviado",
  "error",
];

const comprobanteSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    paciente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
      index: true,
    },
    paciente_nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    paciente_cedula: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },
    correo_destino: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 120,
    },
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      index: true,
    },
    profesional_nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    tipo: {
      type: String,
      required: true,
      enum: TIPOS_COMPROBANTE,
    },
    fecha: {
      type: Date,
      required: true,
      index: true,
    },
    hora_inicio: {
      type: String,
      trim: true,
      default: "",
    },
    hora_fin: {
      type: String,
      trim: true,
      default: "",
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    estado_envio: {
      type: String,
      enum: ESTADOS_ENVIO_COMPROBANTE,
      default: "pendiente",
      required: true,
      index: true,
    },
    enviado_a: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 120,
    },
    enviado_en: {
      type: Date,
      default: null,
    },
    ultimo_error_envio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
    cantidad_envios: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Versión firmada digitalmente (el archivo está en ComprobanteFirmado; aquí solo el resumen)
    firmado: {
      type: new mongoose.Schema(
        {
          nombre_original: { type: String, default: "" },
          tamano: { type: Number, default: 0 },
          subido_por_nombre: { type: String, default: "" },
          subido_en: { type: Date, default: null },
        },
        { _id: false }
      ),
      default: null,
    },
    // Envíos por WhatsApp
    estado_whatsapp: {
      type: String,
      enum: ESTADOS_ENVIO_COMPROBANTE,
      default: "pendiente",
    },
    whatsapp_enviado_a: { type: String, trim: true, default: "", maxlength: 20 },
    whatsapp_enviado_en: { type: Date, default: null },
    whatsapp_version_enviada: { type: String, enum: ["", "firmado", "generado"], default: "" },
    cantidad_envios_whatsapp: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true,
    collection: "comprobantes",
  }
);

comprobanteSchema.index({ fecha: -1, createdAt: -1 });

const consecutivoComprobanteSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    valor: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    versionKey: false,
    collection: "consecutivos_comprobantes",
  }
);

export const ConsecutivoComprobante =
  mongoose.models.ConsecutivoComprobante ||
  mongoose.model(
    "ConsecutivoComprobante",
    consecutivoComprobanteSchema
  );

const ComprobanteModel =
  mongoose.models.Comprobante ||
  mongoose.model("Comprobante", comprobanteSchema);

export default ComprobanteModel;
