const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://armoniadentalanalisis.onrender.com/v1";

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
  const response = await fetch(
    `${API_URL}/comprobantes${query ? `?${query}` : ""}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return procesarRespuesta(response);
};

export const obtenerComprobante = async (id) => {
  const response = await fetch(`${API_URL}/comprobantes/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return procesarRespuesta(response);
};

export const crearComprobante = async (datos) => {
  const response = await fetch(`${API_URL}/comprobantes`, {
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
  const response = await fetch(
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

export const descargarPdfComprobante = async (
  id,
  numero
) => {
  const response = await fetch(
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
