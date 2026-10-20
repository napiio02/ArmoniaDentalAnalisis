import mongoose from "mongoose";

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

    // Control de recordatorios de WhatsApp (uno de cada tipo por cita)
    recordatorioVisperaEnviado: {
      type: Boolean,
      default: false,
    },

    recordatorioMananaEnviado: {
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

const CitaModel = mongoose.model("Cita", citaSchema);

export default CitaModel;