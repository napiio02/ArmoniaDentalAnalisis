const VERSION = "v1";

const API_URL = `https://armoniadentalanalisis.onrender.com/${VERSION}/citas`;
const PACIENTES_URL = `https://armoniadentalanalisis.onrender.com/${VERSION}/pacientes`;
const USUARIOS_URL = `https://armoniadentalanalisis.onrender.com/${VERSION}/users/list`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Error");
  }
  return data;
}


export async function getCitas(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}${query ? `?${query}` : ""}`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return handleResponse(response);
}

export async function createCita(datos) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(datos),
  });
  return handleResponse(response);
}

export async function updateCita(id, datos) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(datos),
  });
  return handleResponse(response);
}

export const getDisponibilidad = async (fecha, tipo) => {
  const response = await fetch(
    `${API_URL}/disponibilidad?fecha=${fecha}&tipo=${encodeURIComponent(tipo)}`,
    {
      headers: getAuthHeaders(),
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error obteniendo disponibilidad");
  }

  return data;
};

export async function cancelarCita(id) {
  const response = await fetch(`${API_URL}/${id}/cancelar`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return handleResponse(response);
}


export async function getPacientes() {
  const response = await fetch(PACIENTES_URL, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo obtenr el paciente");
  return data.data; 
}

export async function getUsuarios() {
  const response = await fetch(USUARIOS_URL, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo obtener el usuario");
  return Array.isArray(data) ? data : data.data ?? []; 
}

export const getCitasAtendidasPorPaciente = async (pacienteId) => {
  const response = await fetch(
    `https://armoniadentalanalisis.onrender.com/${VERSION}/pacientes/${pacienteId}/citas-atendidas`,
    {
      headers: getAuthHeaders(),
      credentials: "include",
    }
  );
  return handleResponse(response);
};
