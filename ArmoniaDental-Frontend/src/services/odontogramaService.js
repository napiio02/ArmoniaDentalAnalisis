const API_URL = "https://armoniadentalanalisis.onrender.com/api/odontogramas";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function procesarRespuesta(response, mensajeDefault) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || mensajeDefault);
  }

  return data;
}

export async function obtenerOdontogramaPorPaciente(pacienteId) {
  const response = await fetch(`${API_URL}/paciente/${pacienteId}`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  return procesarRespuesta(
    response,
    "No se pudo obtener el odontograma."
  );
}

export async function guardarOdontograma(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return procesarRespuesta(
    response,
    "No se pudo guardar el odontograma."
  );
}

export async function obtenerHistorialOdontograma(odontogramaId) {
  const response = await fetch(`${API_URL}/${odontogramaId}/historial`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  return procesarRespuesta(
    response,
    "No se pudo obtener el historial del odontograma."
  );
}