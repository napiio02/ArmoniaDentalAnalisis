const API_URL = "http://localhost:3000/api/odontogramas";

function getAuthHeaders() {
	const token = localStorage.getItem("token");

	return {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
}

export async function obtenerOdontogramaPorPaciente(pacienteId) {
	const response = await fetch(`${API_URL}/paciente/${pacienteId}`, {
		method: "GET",
		headers: getAuthHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "No se pudo obtener el odontograma.");
	}

	return data;
}

export async function guardarOdontograma(payload) {
	const response = await fetch(API_URL, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "No se pudo guardar el odontograma.");
	}

	return data;
}

export async function actualizarOdontograma(id, payload) {
	const response = await fetch(`${API_URL}/${id}`, {
		method: "PUT",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "No se pudo actualizar el odontograma.");
	}

	return data;
}

export async function obtenerHistorialOdontograma(odontogramaId) {
	const response = await fetch(`${API_URL}/${odontogramaId}/historial`, {
		method: "GET",
		headers: getAuthHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "No se pudo obtener el historial.");
	}

	return data;
}

export async function desactivarOdontograma(odontogramaId) {
	const response = await fetch(`${API_URL}/${odontogramaId}`, {
		method: "DELETE",
		headers: getAuthHeaders(),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "No se pudo desactivar el odontograma.");
	}

	return data;
}