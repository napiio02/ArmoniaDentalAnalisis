import { apiFetch } from "./apiClient";
const VERSION = "v1";

const API_URL = `https://armoniadentalbackend.onrender.com/${VERSION}/citas`;
const PACIENTES_URL = `https://armoniadentalbackend.onrender.com/${VERSION}/pacientes`;
const USUARIOS_URL = `https://armoniadentalbackend.onrender.com/${VERSION}/personal`;

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
  const response = await apiFetch(`${API_URL}${query ? `?${query}` : ""}`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return handleResponse(response);
}

export async function createCita(datos) {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(datos),
  });
  return handleResponse(response);
}

export async function updateCita(id, datos) {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(datos),
  });
  return handleResponse(response);
}

export const getDisponibilidad = async (fecha, tipo) => {
  const response = await apiFetch(
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
  const response = await apiFetch(`${API_URL}/${id}/cancelar`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return handleResponse(response);
}


export async function getPacientes() {
  const response = await apiFetch(PACIENTES_URL, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo obtenr el paciente");
  return data.data; 
}

export async function getUsuarios() {
  const response = await apiFetch(USUARIOS_URL, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo obtener el usuario");
  return Array.isArray(data) ? data : data.data ?? []; 
}

export const getCitasAtendidasPorPaciente = async (pacienteId) => {
  const response = await apiFetch(
    `https://armoniadentalbackend.onrender.com/${VERSION}/pacientes/${pacienteId}/citas-atendidas`,
    {
      headers: getAuthHeaders(),
      credentials: "include",
    }
  );
  return handleResponse(response);
};
