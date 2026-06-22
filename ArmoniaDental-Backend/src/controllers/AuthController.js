import {
  completarRegistroAsistente,
  iniciarSesion,
  solicitarRecuperacionPassword,
  restablecerPassword,
} from "../services/AuthService.js";

const COOKIE_NAME = "auth_token";

const obtenerOpcionesCookie = () => {
  const esProduccion = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: esProduccion,
    sameSite: esProduccion ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  };
};

const responderError = (res, error, mensajeDefault) => {
  console.error(mensajeDefault, error);

  return res.status(error.statusCode || 500).json({
    ok: false,
    message: error.message || mensajeDefault,
    data: null,
  });
};

/*
 * Completa el registro de un asistente previamente
 * registrado por la dentista o el administrador.
 */
export const registrarAsistente = async (req, res) => {
  try {
    const usuario = await completarRegistroAsistente(req.body);

    return res.status(200).json({
      ok: true,
      message:
        "Registro completado correctamente. Ya puede iniciar sesión.",
      data: {
        usuario,
      },
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al completar el registro."
    );
  }
};

/*
 * Inicia sesión y guarda el JWT dentro
 * de una cookie HttpOnly.
 */
export const login = async (req, res) => {
  try {
    const resultado = await iniciarSesion(req.body);

    res.cookie(
      COOKIE_NAME,
      resultado.token,
      obtenerOpcionesCookie()
    );

    return res.status(200).json({
      ok: true,
      message: "Inicio de sesión exitoso.",
      data: {
        usuario: resultado.usuario,
      },
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al iniciar sesión."
    );
  }
};

/*
 * Solicita el envío de un correo para recuperar
 * la contraseña.
 *
 * La respuesta siempre es genérica para evitar revelar
 * si un correo está registrado o no.
 */
export const solicitarRecuperacion = async (req, res) => {
  try {
    await solicitarRecuperacionPassword(req.body);

    return res.status(200).json({
      ok: true,
      message:
        "Si el correo está registrado, recibirá un enlace para restablecer su contraseña.",
      data: null,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al solicitar la recuperación de contraseña."
    );
  }
};

/*
 * Cambia la contraseña utilizando el token enviado
 * al correo electrónico del usuario.
 */
export const restablecerContrasena = async (req, res) => {
  try {
    await restablecerPassword(req.body);

    /*
     * Por seguridad, eliminamos cualquier sesión activa
     * después de cambiar la contraseña.
     */
    const opcionesCookie = obtenerOpcionesCookie();

    res.clearCookie(COOKIE_NAME, {
      httpOnly: opcionesCookie.httpOnly,
      secure: opcionesCookie.secure,
      sameSite: opcionesCookie.sameSite,
      path: opcionesCookie.path,
    });

    return res.status(200).json({
      ok: true,
      message:
        "Contraseña restablecida correctamente. Ya puede iniciar sesión.",
      data: null,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al restablecer la contraseña."
    );
  }
};

/*
 * Devuelve la información del usuario autenticado.
 *
 * verifyToken valida la cookie y coloca los datos
 * del usuario dentro de req.user.
 */
export const obtenerSesion = async (req, res) => {
  try {
    return res.status(200).json({
      ok: true,
      message: "Sesión válida.",
      data: {
        usuario: req.user,
      },
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al consultar la sesión."
    );
  }
};

/*
 * Cierra la sesión eliminando la cookie.
 */
export const logout = async (req, res) => {
  try {
    const opcionesCookie = obtenerOpcionesCookie();

    res.clearCookie(COOKIE_NAME, {
      httpOnly: opcionesCookie.httpOnly,
      secure: opcionesCookie.secure,
      sameSite: opcionesCookie.sameSite,
      path: opcionesCookie.path,
    });

    return res.status(200).json({
      ok: true,
      message: "Sesión cerrada correctamente.",
      data: null,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Ocurrió un error al cerrar la sesión."
    );
  }
};