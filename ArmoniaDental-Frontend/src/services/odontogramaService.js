import { API_URL, apiFetch } from "./apiClient";

const BACKEND_URL = API_URL.replace(/\/v\d+$/, "");
const ODONTOGRAMA_URL = `${BACKEND_URL}/api/odontogramas`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function procesarRespuesta(response, mensajeDefault) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || mensajeDefault);
    error.status = response.status;
    error.code = data?.code || "ODONTOGRAM_ERROR";
    throw error;
  }
  return data;
}

export async function obtenerOdontogramaPorPaciente(pacienteId, expedienteId, options = {}) {
  const query = new URLSearchParams({ expediente_id: expedienteId });
  const response = await apiFetch(`${ODONTOGRAMA_URL}/paciente/${pacienteId}?${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
    signal: options.signal,
  });
  return procesarRespuesta(response, "No se pudo obtener el odontograma.");
}

export async function obtenerAccionesOdontograma(options = {}) {
  const response = await apiFetch(`${ODONTOGRAMA_URL}/acciones`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
    signal: options.signal,
  });
  return procesarRespuesta(response, "No se pudo obtener el catálogo del odontograma.");
}

export async function guardarOdontograma(payload) {
  const response = await apiFetch(ODONTOGRAMA_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return procesarRespuesta(response, "No se pudo guardar el odontograma.");
}

export async function obtenerHistorialOdontograma(odontogramaId) {
  const response = await apiFetch(`${ODONTOGRAMA_URL}/${odontogramaId}/historial`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return procesarRespuesta(response, "No se pudo obtener el historial del odontograma.");
}
