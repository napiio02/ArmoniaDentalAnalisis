import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Usuario from "../models/Usuario.js";

const SALT_ROUNDS = 10;
const ROL_ASISTENTE = "Asistente Dental";

const crearError = (mensaje, statusCode = 400) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
};

const normalizarEmail = (email = "") => {
  return email.trim().toLowerCase();
};

const validarPassword = (password) => {
  if (!password || typeof password !== "string") {
    throw crearError("La contraseña es obligatoria.");
  }

  if (password.length < 8) {
    throw crearError("La contraseña debe tener al menos 8 caracteres.");
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw crearError("La contraseña es demasiado extensa.");
  }
};

const generarToken = (usuario) => {
  if (!process.env.JWT_SECRET) {
    throw crearError(
      "No se encontró JWT_SECRET en las variables de entorno.",
      500
    );
  }

  return jwt.sign(
    {
      userId: usuario._id.toString(),
      email: usuario.email,
      rol: usuario.rol_id.nombre,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    }
  );
};

const construirUsuarioSeguro = (usuario) => {
  return {
    _id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    cedula: usuario.cedula,
    telefono: usuario.telefono,
    activo: usuario.activo,
    estado_cuenta: usuario.estado_cuenta,
    rol: {
      _id: usuario.rol_id._id,
      nombre: usuario.rol_id.nombre,
    },
    fecha_activacion: usuario.fecha_activacion,
    ultimo_acceso: usuario.ultimo_acceso,
  };
};

/*
 * Completa el registro de un asistente previamente
 * registrado por la dentista o el administrador.
 */
export const completarRegistroAsistente = async (data) => {
  const { nombre, email, password } = data;

  if (!nombre || !nombre.trim()) {
    throw crearError("El nombre es obligatorio.");
  }

  if (!email || !email.trim()) {
    throw crearError("El correo electrónico es obligatorio.");
  }

  validarPassword(password);

  const emailNormalizado = normalizarEmail(email);

  const usuario = await Usuario.findOne({
    email: emailNormalizado,
  })
    .select("+password_hash")
    .populate("rol_id", "nombre activo");

  if (!usuario) {
    throw crearError(
      "El correo electrónico no está autorizado. Debe comunicarse con la dentista para solicitar acceso.",
      404
    );
  }

  if (!usuario.rol_id) {
    throw crearError("El usuario no tiene un rol válido asignado.", 400);
  }

  if (usuario.rol_id.nombre !== ROL_ASISTENTE) {
    throw crearError(
      "Este correo no corresponde a una cuenta de asistente.",
      403
    );
  }

  if (!usuario.rol_id.activo) {
    throw crearError("El rol asignado al usuario está deshabilitado.", 403);
  }

  if (!usuario.activo) {
    throw crearError(
      "La cuenta fue deshabilitada. Debe comunicarse con la dentista.",
      403
    );
  }

  if (usuario.estado_cuenta === "Bloqueada") {
    throw crearError(
      "La cuenta se encuentra bloqueada. Debe comunicarse con la dentista.",
      403
    );
  }

  if (
    usuario.estado_cuenta === "Activa" ||
    usuario.password_hash
  ) {
    throw crearError(
      "Esta cuenta ya completó su registro. Puede iniciar sesión.",
      409
    );
  }

  usuario.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  usuario.estado_cuenta = "Activa";
  usuario.fecha_activacion = new Date();

  await usuario.save();

  return construirUsuarioSeguro(usuario);
};

/*
 * Inicia sesión para cualquier usuario activo:
 * Admin, Dentista o Asistente Dental.
 */
export const iniciarSesion = async (data) => {
  const { email, password } = data;

  if (!email || !password) {
    throw crearError(
      "El correo electrónico y la contraseña son obligatorios."
    );
  }

  const emailNormalizado = normalizarEmail(email);

  const usuario = await Usuario.findOne({
    email: emailNormalizado,
  })
    .select("+password_hash")
    .populate("rol_id", "nombre activo");

  if (!usuario || !usuario.password_hash) {
    throw crearError(
      "El correo electrónico o la contraseña son incorrectos.",
      401
    );
  }

  if (!usuario.activo) {
    throw crearError("La cuenta se encuentra deshabilitada.", 403);
  }

  if (usuario.estado_cuenta === "Pendiente") {
    throw crearError(
      "Debe completar el registro de su cuenta antes de iniciar sesión.",
      403
    );
  }

  if (usuario.estado_cuenta === "Bloqueada") {
    throw crearError(
      "La cuenta se encuentra bloqueada. Debe comunicarse con la dentista.",
      403
    );
  }

  if (usuario.estado_cuenta !== "Activa") {
    throw crearError("La cuenta no se encuentra activa.", 403);
  }

  if (!usuario.rol_id || !usuario.rol_id.activo) {
    throw crearError(
      "El rol asignado al usuario no está disponible.",
      403
    );
  }

  const passwordCorrecta = await bcrypt.compare(
    password,
    usuario.password_hash
  );

  if (!passwordCorrecta) {
    throw crearError(
      "El correo electrónico o la contraseña son incorrectos.",
      401
    );
  }

  usuario.ultimo_acceso = new Date();
  await usuario.save();

  const token = generarToken(usuario);

  return {
    token,
    usuario: construirUsuarioSeguro(usuario),
  };
};