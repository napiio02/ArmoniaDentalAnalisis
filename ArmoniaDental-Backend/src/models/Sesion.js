import mongoose from "mongoose";
const schema = new mongoose.Schema({
  // El administrador reutiliza un documento; sid cambia en cada login.
  _id: { type: String },
  sid: { type: String, required: true, unique: true },
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
  version: { type: Number, required: true },
  expires_at: { type: Date, required: true },
  revoked_at: { type: Date, default: null },
}, { collection: "sesiones", timestamps: true });
schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("Sesion", schema);
