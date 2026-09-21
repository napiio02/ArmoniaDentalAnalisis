import { API_URL, apiFetch } from "./apiClient";

async function handleResponse(response) {
	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw new Error(data?.message || "No se pudieron cargar los datos del reporte.");
	}

	if (!data?.data) {
		throw new Error("El servidor devolvió una respuesta de reporte inválida.");
	}

	return data.data;
}

export async function obtenerDatosReporte({ desde, hasta, signal } = {}) {
	const parametros = new URLSearchParams({ desde, hasta });
	const response = await apiFetch(`${API_URL}/reportes/resumen?${parametros}`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		signal,
	});

	return handleResponse(response);
}
