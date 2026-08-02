const VERSION = "v1";
const BASE_URL = `https://armoniadentalbackend.onrender.com/${VERSION}`;

function getAuthHeaders() {
	const token = localStorage.getItem("token");

	return {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
}

async function handleResponse(response, mensajeError) {
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || data.error || mensajeError);
	}

	return data;
}

// Devuelve siempre un arreglo, sin importar si el backend responde
// como arreglo plano o como envoltorio { ok, data }.
function normalizarLista(data) {
	if (Array.isArray(data)) return data;
	if (Array.isArray(data?.data)) return data.data;
	return [];
}

export async function obtenerPacientesReporte() {
	const response = await fetch(`${BASE_URL}/pacientes`, {
		method: "GET",
		headers: getAuthHeaders(),
		credentials: "include",
	});

	const data = await handleResponse(response, "No se pudieron obtener los pacientes.");
	return normalizarLista(data);
}

export async function obtenerCitasReporte() {
	const response = await fetch(`${BASE_URL}/citas`, {
		method: "GET",
		headers: getAuthHeaders(),
		credentials: "include",
	});

	const data = await handleResponse(response, "No se pudieron obtener las citas.");
	return normalizarLista(data);
}

export async function obtenerInsumosReporte() {
	const response = await fetch(`${BASE_URL}/insumos`, {
		method: "GET",
		headers: getAuthHeaders(),
		credentials: "include",
	});

	const data = await handleResponse(response, "No se pudieron obtener los insumos.");
	return normalizarLista(data);
}

// GET /marcas/resumen requiere sesión (verifyToken). Devuelve
// { enJornada, horasHoy, marcasHoy, marcasManuales, porEmpleado: [{usuario_id, nombre, rol, totalHoras, diasTrabajados}] }
export async function obtenerResumenMarcasReporte() {
	const response = await fetch(`${BASE_URL}/marcas/resumen`, {
		method: "GET",
		headers: getAuthHeaders(),
		credentials: "include",
	});

	const data = await handleResponse(response, "No se pudo obtener el resumen de marcas.");
	return data?.data ?? { enJornada: 0, horasHoy: 0, marcasHoy: 0, marcasManuales: 0, porEmpleado: [] };
}

// Trae todo lo necesario para armar el reporte completo, en paralelo.
// Si el usuario no tiene sesión activa (marcas requiere token), el reporte
// igual se genera con el resto de los datos y el resumen de horas queda vacío.
export async function obtenerDatosReporte() {
	const [pacientes, citas, insumos, resumenMarcas] = await Promise.all([
		obtenerPacientesReporte(),
		obtenerCitasReporte(),
		obtenerInsumosReporte(),
		obtenerResumenMarcasReporte().catch(() => ({
			enJornada: 0,
			horasHoy: 0,
			marcasHoy: 0,
			marcasManuales: 0,
			porEmpleado: [],
		})),
	]);

	return { pacientes, citas, insumos, resumenMarcas };
}
