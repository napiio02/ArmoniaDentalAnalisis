import { apiFetch, API_URL } from "./apiClient";

const procesarRespuesta = async (response) => {
  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(resultado.error || resultado.message || "Ocurrió un error al procesar la solicitud.");
  }

  return resultado;
};

export const listarUsuarios = async () => {
  const response = await apiFetch(`${API_URL}/users/list`, {
    method: "GET",
    credentials: "include",
  });
  return procesarRespuesta(response);
};

export const obtenerUsuario = async (id) => {
  const response = await apiFetch(`${API_URL}/users/info/${id}`, { credentials: "include" });
  return procesarRespuesta(response);
};

export const listarRoles = async () => {
  const response = await apiFetch(`${API_URL}/roles/list`, { credentials: "include" });
  return procesarRespuesta(response);
};

const enviarUsuario = async (ruta, method, datos) => {
  const response = await apiFetch(`${API_URL}${ruta}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...(datos !== undefined ? { body: JSON.stringify(datos) } : {}),
  });
  return procesarRespuesta(response);
};

export const crearUsuario = (datos) => enviarUsuario("/users", "POST", datos);
export const editarUsuario = (id, datos) => enviarUsuario(`/users/${id}`, "PUT", datos);
export const cambiarEstadoUsuario = (id, activo) => enviarUsuario(`/users/${id}/status`, "PATCH", { activo });
export const eliminarUsuario = (id) => enviarUsuario(`/users/${id}`, "DELETE");

export const listarPersonal = async () => procesarRespuesta(await apiFetch(`${API_URL}/personal`));
