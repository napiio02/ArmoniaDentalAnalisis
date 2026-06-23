const VERSION = "v1";

const API_URL = `http://localhost:3000/${VERSION}/pacientes`;

function getAuthHeaders() {
	const token = localStorage.getItem("token");

	return {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
}

export async function obtenerPacientesConExpediente() {
	const response = await fetch(API_URL, {
		method: "GET",
		headers: getAuthHeaders(),
		credentials: "include",
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "No se pudieron obtener los pacientes.");
	}

	return data;
}

export async function crearPaciente(datos) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(datos),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo registrar el paciente.");
  }

  return data;
}

export async function obtenerPacientePorId(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo obtener el paciente.");
  }

  return data;
}