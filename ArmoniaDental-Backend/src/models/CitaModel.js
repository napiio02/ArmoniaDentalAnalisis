import mongoose from "mongoose";

const HORA_MS = 60 * 60 * 1000;

const citaSchema = new mongoose.Schema(
  {
    paciente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },

    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },

    fecha_hora: {
      type: Date,
      required: true,
    },

    tipo: {
      type: String,
      required: true,
      enum: [
        "Limpieza",
        "Revisión",
        "Cirugía",
        "Blanqueamiento",
        "Ortodoncia",
        "Empaste",
        "Radiografía",
      ],
    },

    estado: {
      type: String,
      required: true,
      default: "Programada",
      enum: [
        "Programada",
        "Confirmada",
        "En atención",
        "Atendida",
        "Cancelada",
        "No asistió",
      ],
    },

    motivo: {
      type: String,
      trim: true,
      required: true,
      maxlength: 500,
    },

    observaciones: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    // Control de recordatorios de WhatsApp (uno por cita)
    recordatorio24Enviado: {
      type: Boolean,
      default: false,
    },

    recordatorio12Enviado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "citas",
  }
);

// Acelera la búsqueda del job de recordatorios
citaSchema.index({ fecha_hora: 1, estado: 1 });

/*
 * Si una cita se agenda cuando ya está dentro de la ventana de un
 * recordatorio (ej. se crea para dentro de 5 h), ese recordatorio se omite.
 */
citaSchema.pre("save", function (next) {
  if (this.isNew && this.fecha_hora) {
    const faltan = new Date(this.fecha_hora).getTime() - Date.now();
    if (faltan <= 24 * HORA_MS) this.recordatorio24Enviado = true;
    if (faltan <= 12 * HORA_MS) this.recordatorio12Enviado = true;
  }
  next();
});

const CitaModel = mongoose.model("Cita", citaSchema);

export default CitaModel;