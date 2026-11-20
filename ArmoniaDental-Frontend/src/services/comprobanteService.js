import { apiFetch, API_URL } from "./apiClient";

const procesarRespuesta = async (response) => {
  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(
      resultado.message ||
        "Ocurrió un error al procesar la solicitud."
    );
  }

  return resultado;
};

export const listarComprobantes = async (filtros = {}) => {
  const parametros = new URLSearchParams();

  if (filtros.tipo) parametros.set("tipo", filtros.tipo);
  if (filtros.paciente) parametros.set("paciente", filtros.paciente);
  if (filtros.busqueda) parametros.set("busqueda", filtros.busqueda);

  const query = parametros.toString();
  const response = await apiFetch(
    `${API_URL}/comprobantes${query ? `?${query}` : ""}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return procesarRespuesta(response);
};

export const obtenerComprobante = async (id) => {
  const response = await apiFetch(`${API_URL}/comprobantes/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return procesarRespuesta(response);
};

export const crearComprobante = async (datos) => {
  const response = await apiFetch(`${API_URL}/comprobantes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(response);
};

export const enviarComprobante = async (
  id,
  correoDestino
) => {
  const body = correoDestino
    ? { correo_destino: correoDestino }
    : {};
  const response = await apiFetch(
    `${API_URL}/comprobantes/${id}/enviar`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    }
  );

  return procesarRespuesta(response);
};

// PDF generado por el servidor (el mismo que se envía por correo)
// version: "generado" (para firmar) o "firmado"
export const obtenerPdfComprobante = async (id, version = "generado") => {
  const response = await apiFetch(`${API_URL}/comprobantes/${id}/pdf?version=${version}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    const resultado = await response.json().catch(() => ({}));
    throw new Error(resultado.message || "No se pudo generar el comprobante.");
  }
  return response.blob();
};

export const descargarPdfComprobante = async (
  id,
  numero
) => {
  const response = await apiFetch(
    `${API_URL}/comprobantes/${id}/pdf`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const resultado = await response.json();
    throw new Error(
      resultado.message || "No se pudo descargar el comprobante."
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = `${numero || "comprobante"}.pdf`;
  enlace.click();
  URL.revokeObjectURL(url);
};

// Sube el PDF firmado digitalmente (reemplaza el anterior si existía)
export const subirComprobanteFirmado = async (id, archivo) => {
  const formulario = new FormData();
  formulario.append("archivo", archivo);
  const response = await apiFetch(`${API_URL}/comprobantes/${id}/firmado`, {
    method: "POST",
    credentials: "include",
    body: formulario,
  });
  return procesarRespuesta(response);
};

export const quitarComprobanteFirmado = async (id) => {
  const response = await apiFetch(`${API_URL}/comprobantes/${id}/firmado`, {
    method: "DELETE",
    credentials: "include",
  });
  return procesarRespuesta(response);
};

// Envía por WhatsApp la versión firmada si existe; si no, la generada por el sistema
export const enviarWhatsappComprobante = async (id) => {
  const response = await apiFetch(`${API_URL}/comprobantes/${id}/whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({}),
  });
  return procesarRespuesta(response);
};
