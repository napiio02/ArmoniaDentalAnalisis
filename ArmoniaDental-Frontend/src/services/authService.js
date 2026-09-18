import { apiFetch, API_URL } from "./apiClient";

const procesarRespuesta = async (response) => {
  const resultado = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(resultado.message || "Ocurrió un error al procesar la solicitud."), { code: resultado.code, status: response.status });
  }

  return resultado;
};

export const iniciarSesion = async (credenciales) => {
  const response = await apiFetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(credenciales),
  });

  return procesarRespuesta(response);
};

export const obtenerSesion = async () => {
  const response = await apiFetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  return procesarRespuesta(response);
};

export const cerrarSesion = async () => {
  const response = await apiFetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  return procesarRespuesta(response);
};

export const registrarAsistente = async (datos) => {
  const response = await apiFetch(`${API_URL}/auth/registro`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(response);
};

/*
 * Solicita el envío del correo de recuperación.
 */
export const solicitarRecuperacionPassword = async (email) => {
  const response = await apiFetch(
    `${API_URL}/auth/recuperar-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
      }),
    }
  );

  return procesarRespuesta(response);
};

/*
 * Envía el token y la nueva contraseña al backend.
 */
export const restablecerPassword = async ({
  token,
  password,
  confirmarPassword,
}) => {
  const response = await apiFetch(
    `${API_URL}/auth/restablecer-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        token,
        password,
        confirmarPassword,
      }),
    }
  );

  return procesarRespuesta(response);
};
