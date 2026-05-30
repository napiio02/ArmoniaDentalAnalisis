import mongoose from "mongoose";

const pacienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    cedula: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
      index: true,
    },
    telefono: {
      type: String,
      trim: true,
      default: "",
      maxlength: 30,
    },
    correo: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 120,
    },
    fecha_nacimiento: {
      type: Date,
      default: null,
    },
    alergias: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "pacientes",
  }
);

const PacienteModel = mongoose.model("Paciente", pacienteSchema);

export default PacienteModel;