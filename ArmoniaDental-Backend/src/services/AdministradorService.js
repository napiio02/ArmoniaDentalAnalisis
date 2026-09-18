import Usuario from "../models/Usuario.js";
import Rol from "../models/Roles.js";
import Sesion from "../models/Sesion.js";

// Se ejecuta antes de aceptar conexiones. No altera usuarios existentes.
export const prepararSeguridad = async () => {
  if (!process.env.JWT_SECRET) throw new Error("Falta JWT_SECRET; no se puede iniciar la autenticación.");
  const roles = await Rol.find({ nombre: "Admin" });
  if (roles.length !== 1 || !roles[0].activo) throw new Error("Debe existir exactamente un rol Admin activo en MongoDB.");
  const administradores = await Usuario.find({ rol_id: roles[0]._id }).select("+password_hash");
  if (administradores.length !== 1 || !administradores[0].activo ||
      administradores[0].estado_cuenta !== "Activa" || !administradores[0].password_hash) {
    throw new Error("Debe existir exactamente un usuario Admin activo, registrado y con contraseña. Revise MongoDB antes de iniciar.");
  }
  // El índice parcial protege incluso altas/promociones concurrentes.
  await Usuario.collection.createIndex({ rol_id: 1 }, {
    name: "administrador_unico", unique: true, partialFilterExpression: { rol_id: roles[0]._id },
  });
  await Sesion.init();
};
