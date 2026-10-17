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
      type: [String],
      default: [],
    },
    enfermedades: {
      type: [String],
      default: [],
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
  },
);

// La cédula es única por paciente. El índice es parcial para ignorar las cédulas vacías
// (varios pacientes antiguos pueden tener cedula = "").
pacienteSchema.index(
  { cedula: 1 },
  {
    name: "cedula_unica",
    unique: true,
    partialFilterExpression: { cedula: { $gt: "" } },
  },
);

const PacienteModel = mongoose.model("Paciente", pacienteSchema);

export default PacienteModel;