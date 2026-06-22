import Usuario from "../models/Usuario.js";

const crearError = (mensaje, statusCode = 400) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
};

const normalizarEmail = (email = "") => {
  return email.trim().toLowerCase();
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
 * Prerregistro de un usuario realizado por Laura o Admin.
 *
 * En este momento todavía no se asigna una contraseña.
 * El asistente deberá completar posteriormente su registro.
 */
export const createUser = async (data) => {
  const {
    nombre,
    email,
    cedula,
    telefono,
    rol_id,
    activo,
  } = data;

  if (!nombre || !email || !cedula || !telefono || !rol_id) {
    throw crearError(
      "Nombre, correo, cédula, teléfono y rol son obligatorios."
    );
  }

  const emailNormalizado = normalizarEmail(email);
  const cedulaNormalizada = cedula.trim();

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
    nombre: nombre.trim(),
    email: emailNormalizado,
    password_hash: null,
    cedula: cedulaNormalizada,
    telefono: telefono.trim(),
    rol_id,
    activo: activo ?? true,
    estado_cuenta: "Pendiente",
    fecha_activacion: null,
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
 * La contraseña y la activación de la cuenta no se modifican aquí.
 * Esos procesos estarán en AuthService.
 */
export const modifyUser = async (id, data) => {
  const usuarioActual = await Usuario.findById(id);

  if (!usuarioActual) {
    throw crearError("Usuario no encontrado.", 404);
  }

  const updateData = {};

  if (data.nombre !== undefined) {
    updateData.nombre = data.nombre.trim();
  }

  if (data.email !== undefined) {
    const emailNormalizado = normalizarEmail(data.email);

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
    const cedulaNormalizada = data.cedula.trim();

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
    updateData.telefono = data.telefono.trim();
  }

  if (data.rol_id !== undefined) {
    updateData.rol_id = data.rol_id;
  }

  if (data.activo !== undefined) {
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
  const usuarioEliminado = await Usuario.findByIdAndDelete(id);

  if (!usuarioEliminado) {
    throw crearError("Usuario no encontrado.", 404);
  }

  return usuarioEliminado;
};