const API_URL = import.meta.env.VITE_API_URL || "https://armoniadentalanalisis.onrender.com/v1";

const procesarRespuesta = async (response) => {
  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(resultado.message || "Ocurrió un error al procesar la solicitud.");
  }

  return resultado;
};

export const listarUsuarios = async () => {
  const response = await fetch(`${API_URL}/users/list`, {
    method: "GET",
    credentials: "include",
  });
  return procesarRespuesta(response);
};