import Usuario from "../models/Usuario.js";
import Rol from "../models/Roles.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Marca from "../models/MarcaModel.js";
import Cita from "../models/CitaModel.js";
import Comprobante from "../models/ComprobanteModel.js";
import Odontograma from "../models/Odontograma/OdontogramaModel.js";
import Historial from "../models/Odontograma/HistorialModel.js";

const ROLES_USUARIOS = ["Admin", "Dentista", "Asistente Dental"];

const crearError = (mensaje, statusCode = 400) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
};

const normalizarEmail = (email = "") => {
  return email.trim().toLowerCase();
};

const validarId = (id) => {
  if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
    throw crearError("El identificador no es válido.");
  }
};

const validarTexto = (valor, campo) => {
  if (typeof valor !== "string" || !valor.trim()) {
    throw crearError(`${campo} es obligatorio.`);
  }
  return valor.trim();
};

const validarEmail = (valor) => {
  const email = normalizarEmail(validarTexto(valor, "El correo"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw crearError("El correo electrónico no es válido.");
  }
  return email;
};

const validarRol = async (id) => {
  validarId(id);
  const rol = await Rol.findById(id);
  if (!rol || !rol.activo || !ROLES_USUARIOS.includes(rol.nombre)) {
    throw crearError("Seleccione un rol disponible: Admin, Dentista o Asistente Dental.");
  }
};

const validarActivo = (activo) => {
  if (activo !== undefined && typeof activo !== "boolean") {
    throw crearError("El estado activo debe ser verdadero o falso.");
  }
};

/*
 * Obtiene todos los usuarios registrados.
 * Los campos sensibles no se devuelven porque tienen select: false
 * en el modelo Usuario.
 */
export const getUserList = async () => {
  return await Usuario.find()
    .populate("rol_id", "nombre descripcion activo")
    .sort({ createdAt: -1 });
};

/*
 * Obtiene la información de un usuario específico.
 */
export const getUserInfo = async (id) => {
  validarId(id);
  const usuario = await Usuario.findById(id).populate(
    "rol_id",
    "nombre descripcion activo"
  );

  if (!usuario) {
    throw crearError("Usuario no encontrado.", 404);
  }

  return usuario;
};

/*
 * Crea una cuenta con contraseña inicial desde Administración.
 */
export const createUser = async (data) => {
  const {
    nombre,
    email,
    cedula,
    telefono,
    rol_id,
    activo,
    password,
  } = data;

  if (!nombre || !email || !cedula || !telefono || !rol_id) {
    throw crearError(
      "Nombre, correo, cédula, teléfono y rol son obligatorios."
    );
  }

  const nombreNormalizado = validarTexto(nombre, "El nombre");
  const emailNormalizado = validarEmail(email);
  const cedulaNormalizada = validarTexto(cedula, "La cédula");
  const telefonoNormalizado = validarTexto(telefono, "El teléfono");
  validarActivo(activo);
  await validarRol(rol_id);
  if (typeof password !== "string" || password.length < 8) {
    throw crearError("La contraseña inicial debe tener al menos 8 caracteres.");
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw crearError("La contraseña inicial es demasiado extensa.");
  }

  const usuarioConEmail = await Usuario.findOne({
    email: emailNormalizado,
  });

  if (usuarioConEmail) {
    throw crearError(
      "Ya existe un usuario registrado con ese correo electrónico.",
      409
    );
  }

  const usuarioConCedula = await Usuario.findOne({
    cedula: cedulaNormalizada,
  });

  if (usuarioConCedula) {
    throw crearError(
      "Ya existe un usuario registrado con esa cédula.",
      409
    );
  }

  const nuevoUsuario = await Usuario.create({
    nombre: nombreNormalizado,
    email: emailNormalizado,
    password_hash: await bcrypt.hash(password, 10),
    cedula: cedulaNormalizada,
    telefono: telefonoNormalizado,
    rol_id,
    activo: activo ?? true,
    estado_cuenta: "Activa",
    fecha_activacion: new Date(),
    ultimo_acceso: null,
  });

  return await Usuario.findById(nuevoUsuario._id).populate(
    "rol_id",
    "nombre descripcion activo"
  );
};

/*
 * Modifica la información administrativa de un usuario.
 *
 * No modifica la contraseña ni el estado del registro de la cuenta.
 */
export const modifyUser = async (id, data) => {
  validarId(id);
  const usuarioActual = await Usuario.findById(id);

  if (!usuarioActual) {
    throw crearError("Usuario no encontrado.", 404);
  }

  const updateData = {};

  if (data.nombre !== undefined) {
    updateData.nombre = validarTexto(data.nombre, "El nombre");
  }

  if (data.email !== undefined) {
    const emailNormalizado = validarEmail(data.email);

    const usuarioConEmail = await Usuario.findOne({
      email: emailNormalizado,
      _id: { $ne: id },
    });

    if (usuarioConEmail) {
      throw crearError(
        "Ya existe otro usuario registrado con ese correo electrónico.",
        409
      );
    }

    updateData.email = emailNormalizado;
  }

  if (data.cedula !== undefined) {
    const cedulaNormalizada = validarTexto(data.cedula, "La cédula");

    const usuarioConCedula = await Usuario.findOne({
      cedula: cedulaNormalizada,
      _id: { $ne: id },
    });

    if (usuarioConCedula) {
      throw crearError(
        "Ya existe otro usuario registrado con esa cédula.",
        409
      );
    }

    updateData.cedula = cedulaNormalizada;
  }

  if (data.telefono !== undefined) {
    updateData.telefono = validarTexto(data.telefono, "El teléfono");
  }

  if (data.rol_id !== undefined) {
    await validarRol(data.rol_id);
    updateData.rol_id = data.rol_id;
  }

  if (data.activo !== undefined) {
    validarActivo(data.activo);
    updateData.activo = data.activo;
  }

  const usuarioActualizado = await Usuario.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).populate("rol_id", "nombre descripcion activo");

  return usuarioActualizado;
};

/*
 * Elimina permanentemente un usuario.
 */
export const deleteUsuario = async (id) => {
  validarId(id);
  await getUserInfo(id);
  // Conserva las referencias que utilizan los demás módulos del sistema.
  const referencias = await Promise.all([
    Marca.exists({ $or: [{ usuario_id: id }, { creado_por: id }, { "justificacion.revisado_por": id }] }),
    Cita.exists({ usuario_id: id }),
    Comprobante.exists({ usuario_id: id }),
    Odontograma.exists({ $or: [{ creado_por_id: id }, { actualizado_por_id: id }] }),
    Historial.exists({ registrado_por_id: id }),
  ]);
  if (referencias.some(Boolean)) {
    throw crearError("El usuario tiene registros asociados. Desactívelo para conservar su historial.", 409);
  }
  const usuarioEliminado = await Usuario.findByIdAndDelete(id);

  if (!usuarioEliminado) {
    throw crearError("Usuario no encontrado.", 404);
  }

  return usuarioEliminado;
};