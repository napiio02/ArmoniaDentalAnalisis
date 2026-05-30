const API_URL = "http://localhost:3000/api/pacientes";

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