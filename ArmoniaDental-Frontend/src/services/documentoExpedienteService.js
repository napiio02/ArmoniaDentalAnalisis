const VERSION = "v1";
const API_URL = `http://localhost:3000/${VERSION}`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function subirDocumento(expedienteId, { tipo, paciente_id, archivo }) {
  const formData = new FormData();
  formData.append("tipo", tipo);
  formData.append("paciente_id", paciente_id);
  formData.append("archivo", archivo);

  const response = await fetch(`${API_URL}/expedientes/${expedienteId}/documentos`, {
    method: "POST",
    headers: getAuthHeaders(), // NO poner Content-Type, el navegador lo define con el boundary del FormData
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo subir el documento.");
  }

  return data;
}

export async function obtenerDocumentosPorExpediente(expedienteId) {
  const response = await fetch(`${API_URL}/expedientes/${expedienteId}/documentos`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudieron obtener los documentos.");
  }

  return data;
}

export function getUrlDescarga(documentoId) {
  return `${API_URL}/documentos/${documentoId}/descargar`;
}

export function getUrlVer(documentoId) {
  return `${API_URL}/documentos/${documentoId}/ver`;
}

export async function guardarAnotaciones(documentoId, anotaciones) {
  const response = await fetch(`${API_URL}/documentos/${documentoId}/anotaciones`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify({ anotaciones }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudieron guardar las anotaciones.");
  }

  return data;
}

export async function eliminarDocumento(documentoId) {
  const response = await fetch(`${API_URL}/documentos/${documentoId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo eliminar el documento.");
  }

  return data;
}

export async function descargarPdfAnotado(documentoId, anotaciones, nombreOriginal) {
  const response = await fetch(`${API_URL}/documentos/${documentoId}/descargar-anotado`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify({ anotaciones }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "No se pudo generar el PDF anotado.");
  }

  // Convertir la respuesta binaria a un blob y disparar la descarga
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreOriginal
  ? nombreOriginal.replace(".pdf", "_anotado.pdf")
  : "documento_anotado.pdf";
  a.click();
  URL.revokeObjectURL(url);
}