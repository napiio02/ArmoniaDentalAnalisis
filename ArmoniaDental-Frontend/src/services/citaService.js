const API_URL = "http://localhost:3000/api/citas";
const PACIENTES_URL = "http://localhost:3000/api/pacientes";
const USUARIOS_URL = "http://localhost:3000/v1/users/list";

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
