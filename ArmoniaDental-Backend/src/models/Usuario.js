import mongoose from "mongoose";

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    /*
     * Será null mientras el asistente solamente esté prerregistrado.
     * Se guardará cifrada cuando complete su registro.
     */
    password_hash: {
      type: String,
      default: null,
      select: false,
    },

    cedula: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    telefono: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Permite a la administración habilitar o deshabilitar
     * al usuario sin eliminarlo de la base de datos.
     */
    activo: {
      type: Boolean,
      default: true,
      required: true,
    },

    /*
     * Pendiente: asistente prerregistrado, pero sin contraseña.
     * Activa: registro completado y puede iniciar sesión.
     * Bloqueada: no puede iniciar sesión.
     */
    estado_cuenta: {
      type: String,
      enum: ["Pendiente", "Activa", "Bloqueada"],
      default: "Pendiente",
      required: true,
    },

    rol_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rol",
      required: true,
    },

    fecha_activacion: {
      type: Date,
      default: null,
    },

    ultimo_acceso: {
      type: Date,
      default: null,
    },

    reset_password_token_hash: {
      type: String,
      default: null,
      select: false,
    },

    reset_password_expires_at: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    collection: "usuarios",
    timestamps: true,
  }
);

const Usuario = mongoose.model("Usuario", UsuarioSchema);

export default Usuario;