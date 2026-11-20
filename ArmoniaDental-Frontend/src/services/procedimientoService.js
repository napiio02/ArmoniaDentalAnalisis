import { apiFetch, API_URL } from "./apiClient";

// Procedimientos del paciente: costo, abonos y saldo (solo Admin y Dentista)
const solicitar = async (url, { method = "GET", body } = {}) => {
  const response = await apiFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "No se pudo completar la operación.");
  return data;
};

// { data: { procedimientos, resumen: { total, abonado, saldo, cantidad, conSaldo } } }
export const listarProcedimientos = (pacienteId) =>
  solicitar(`${API_URL}/pacientes/${pacienteId}/procedimientos`);

// datos: { fecha, procedimiento, pieza, notas, monto, abono_inicial?, metodo_pago? }
export const crearProcedimiento = (pacienteId, datos) =>
  solicitar(`${API_URL}/pacientes/${pacienteId}/procedimientos`, { method: "POST", body: datos });

export const actualizarProcedimiento = (id, datos) =>
  solicitar(`${API_URL}/procedimientos/${id}`, { method: "PUT", body: datos });

export const anularProcedimiento = (id, motivo) =>
  solicitar(`${API_URL}/procedimientos/${id}/anular`, { method: "PATCH", body: { motivo } });

// datos: { fecha, monto, metodo, nota }
export const registrarAbono = (id, datos) =>
  solicitar(`${API_URL}/procedimientos/${id}/abonos`, { method: "POST", body: datos });

export const anularAbono = (id, abonoId, motivo) =>
  solicitar(`${API_URL}/procedimientos/${id}/abonos/${abonoId}/anular`, { method: "PATCH", body: { motivo } });

export const METODOS_PAGO = ["Efectivo", "SINPE Móvil", "Tarjeta", "Transferencia", "Otro"];
