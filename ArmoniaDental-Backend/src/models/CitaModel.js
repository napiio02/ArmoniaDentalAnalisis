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
      ref: "Users",
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
  },
  {
    timestamps: true,
    collection: "citas",
  }
);

const CitaModel = mongoose.model("Cita", citaSchema);

export default CitaModel;
