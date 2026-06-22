import {
  completarRegistroAsistente,
  iniciarSesion,
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
      message: "Registro completado correctamente. Ya puede iniciar sesión.",
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