import bcrypt from "bcrypt";
import { crearSesion, revocarSesion, revocarSesionesUsuario } from "./SesionService.js";
import crypto from "node:crypto";

import Usuario from "../models/Usuario.js";
import { enviarCorreoRecuperacion } from "./EmailService.js";

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
    throw crearError(
      "La contraseña debe tener al menos 8 caracteres."
    );
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw crearError("La contraseña es demasiado extensa.");
  }
};

const obtenerMinutosExpiracion = () => {
  const minutos = Number(
    process.env.RESET_PASSWORD_EXPIRES_MINUTES || 20
  );

  if (!Number.isFinite(minutos) || minutos <= 0) {
    return 20;
  }

  return minutos;
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
    throw crearError(
      "El usuario no tiene un rol válido asignado.",
      400
    );
  }

  if (usuario.rol_id.nombre !== ROL_ASISTENTE) {
    throw crearError(
      "Este correo no corresponde a una cuenta de asistente.",
      403
    );
  }

  if (!usuario.rol_id.activo) {
    throw crearError(
      "El rol asignado al usuario está deshabilitado.",
      403
    );
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

  usuario.password_hash = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );

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
    throw crearError(
      "La cuenta se encuentra deshabilitada.",
      403
    );
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
    throw crearError(
      "La cuenta no se encuentra activa.",
      403
    );
  }

  if (!usuario.rol_id || !usuario.rol_id.activo || !["Admin", "Dentista", "Asistente Dental"].includes(usuario.rol_id.nombre)) {
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

  const sesion = await crearSesion(usuario);
  // No emitir credenciales si la cuenta cambió mientras se comprobaba la contraseña.
  try {
    const resultado = await Usuario.updateOne({ _id: usuario._id, activo: true, estado_cuenta: "Activa",
      rol_id: usuario.rol_id._id, password_hash: usuario.password_hash,
      $or: [{ session_version: usuario.session_version ?? 0 }, { session_version: { $exists: false } }],
    }, { $set: { ultimo_acceso: new Date() } });
    if (!resultado.matchedCount) throw crearError("La cuenta cambió. Inicie sesión nuevamente.", 401);
  } catch (error) {
    await revocarSesion(sesion.sid);
    throw error;
  }
  return { ...sesion, usuario: construirUsuarioSeguro(usuario) };
};

/*
 * Genera y envía un enlace de recuperación.
 *
 * Siempre finaliza de la misma forma si el correo no existe,
 * evitando revelar qué cuentas están registradas.
 */
export const solicitarRecuperacionPassword = async (data) => {
  const { email } = data;

  if (!email || !email.trim()) {
    throw crearError(
      "El correo electrónico es obligatorio."
    );
  }

  const frontendBaseURL = (
    process.env.FRONTEND_URL ||
    process.env.frontend_url ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const emailNormalizado = normalizarEmail(email);

  const usuario = await Usuario.findOne({
    email: emailNormalizado,
  });

  /*
   * No enviamos nada si no existe, está deshabilitado
   * o todavía no ha completado su registro.
   *
   * Tampoco devolvemos un error que permita descubrir
   * si el correo existe.
   */
  if (
    !usuario ||
    !usuario.activo ||
    usuario.estado_cuenta !== "Activa"
  ) {
    return true;
  }

  const tokenRecuperacion = crypto
    .randomBytes(32)
    .toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(tokenRecuperacion)
    .digest("hex");

  const minutosExpiracion = obtenerMinutosExpiracion();

  const fechaExpiracion = new Date(
    Date.now() + minutosExpiracion * 60 * 1000
  );

  usuario.reset_password_token_hash = tokenHash;
  usuario.reset_password_expires_at = fechaExpiracion;

  await usuario.save();

  const enlaceRecuperacion =
    `${frontendBaseURL}/restablecer-password` +
    `?token=${encodeURIComponent(tokenRecuperacion)}`;

  try {
    await enviarCorreoRecuperacion({
      destinatario: usuario.email,
      nombre: usuario.nombre,
      enlaceRecuperacion,
      minutosExpiracion,
    });
  } catch (error) {
    /*
     * Si Gmail falla, eliminamos el token para no dejar
     * una recuperación activa que nunca fue enviada.
     */
    usuario.reset_password_token_hash = null;
    usuario.reset_password_expires_at = null;

    await usuario.save();

    console.error(
      "Error enviando el correo de recuperación:",
      error
    );

    throw crearError(
      "No fue posible enviar el correo de recuperación.",
      500
    );
  }

  return true;
};

/*
 * Cambia la contraseña utilizando el token recibido
 * mediante correo electrónico.
 */
export const restablecerPassword = async (data) => {
  const {
    token,
    password,
    confirmarPassword,
    confirmPassword,
  } = data;

  if (!token || !token.trim()) {
    throw crearError(
      "El enlace de recuperación no es válido."
    );
  }

  validarPassword(password);

  /*
   * Admitimos ambos nombres para facilitar la conexión
   * con el formulario del frontend.
   */
  const confirmacion =
    confirmarPassword ?? confirmPassword;

  if (
    confirmacion !== undefined &&
    password !== confirmacion
  ) {
    throw crearError(
      "Las contraseñas no coinciden."
    );
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(token.trim())
    .digest("hex");

  const usuario = await Usuario.findOne({
    reset_password_token_hash: tokenHash,
    reset_password_expires_at: {
      $gt: new Date(),
    },
    activo: true,
    estado_cuenta: "Activa",
  }).select(
    "+password_hash " +
      "+reset_password_token_hash " +
      "+reset_password_expires_at"
  );

  if (!usuario) {
    throw crearError(
      "El enlace de recuperación es inválido o ya expiró.",
      400
    );
  }

  usuario.password_hash = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );

  /*
   * El token se elimina para impedir que el enlace
   * vuelva a utilizarse.
   */
  usuario.reset_password_token_hash = null;
  usuario.reset_password_expires_at = null;

  // Actualización atómica: consume el enlace una sola vez y revoca por versión.
  const resultado = await Usuario.updateOne({ _id: usuario._id, reset_password_token_hash: tokenHash,
    reset_password_expires_at: { $gt: new Date() }, activo: true, estado_cuenta: "Activa" }, {
    $set: { password_hash: usuario.password_hash, reset_password_token_hash: null, reset_password_expires_at: null },
    $inc: { session_version: 1 },
  });
  if (!resultado.matchedCount) throw crearError("El enlace de recuperación ya no es válido.");
  await revocarSesionesUsuario(usuario._id);

  return true;
};