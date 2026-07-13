const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/v1";

const procesarRespuesta = async (response) => {
  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(resultado.message || "Ocurrió un error al procesar la solicitud.");
  }

  return resultado;
};

const construirQuery = (params = {}) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return query ? `?${query}` : "";
};

export const obtenerMarcas = async ({ fecha, usuario_id, estado } = {}) => {
  const response = await fetch(
    `${API_URL}/marcas${construirQuery({ fecha, usuario_id, estado })}`,
    { method: "GET", credentials: "include" },
  );
  return procesarRespuesta(response);
};

export const obtenerResumenMarcas = async () => {
  const response = await fetch(`${API_URL}/marcas/resumen`, {
    method: "GET",
    credentials: "include",
  });
  return procesarRespuesta(response);
};

export const obtenerJornadaActiva = async () => {
  const response = await fetch(`${API_URL}/marcas/jornada-activa`, {
    method: "GET",
    credentials: "include",
  });
  return procesarRespuesta(response);
};

export const obtenerMarcasPendientes = async () => {
  const response = await fetch(`${API_URL}/marcas/pendientes`, {
    method: "GET",
    credentials: "include",
  });
  return procesarRespuesta(response);
};

export const iniciarJornada = async () => {
  const response = await fetch(`${API_URL}/marcas/iniciar`, {
    method: "POST",
    credentials: "include",
  });
  return procesarRespuesta(response);
};

export const finalizarJornada = async () => {
  const response = await fetch(`${API_URL}/marcas/finalizar`, {
    method: "POST",
    credentials: "include",
  });
  return procesarRespuesta(response);
};

export const crearMarcaManual = async (datos) => {
  const response = await fetch(`${API_URL}/marcas/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(datos),
  });
  return procesarRespuesta(response);
};

export const justificarMarca = async (id, datos) => {
  const response = await fetch(`${API_URL}/marcas/${id}/justificar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(datos),
  });
  return procesarRespuesta(response);
};

export const aprobarMarca = async (id, comentario = "") => {
  const response = await fetch(`${API_URL}/marcas/${id}/aprobar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ comentario }),
  });
  return procesarRespuesta(response);
};

export const rechazarMarca = async (id, comentario = "") => {
  const response = await fetch(`${API_URL}/marcas/${id}/rechazar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ comentario }),
  });
  return procesarRespuesta(response);
};