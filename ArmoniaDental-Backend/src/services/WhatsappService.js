import axios from "axios";
import CitaModel from "../models/CitaModel.js";

export const procesarRespuestaBoton = async (payload) => {
  const [accion, citaId] = payload.split("_");

  const cita = await CitaModel.findById(citaId);
  if (!cita) {
    console.warn(`Cita no encontrada para el payload: ${payload}`);
    return;
  }

  if (accion === "CONFIRMAR") {
    cita.estado = "Confirmada";
    await cita.save();
    console.log(`Cita ${citaId} confirmada por el paciente.`);
  } else if (accion === "CANCELAR") {
    cita.estado = "Cancelada";
    await cita.save();
    console.log(`Cita ${citaId} cancelada por el paciente.`);
  }
};

const WHATSAPP_API_URL = `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

const headers = {
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
};

/*
 * Envía la plantilla de confirmación de cita con botones
 * de respuesta rápida (Confirmar / Cancelar).
 *
 * La plantilla debe estar previamente creada y aprobada
 * en Meta con el mismo nombre y la misma cantidad de
 * variables {{1}}, {{2}}, etc.
 */
export const enviarMensajePlantilla = async ({
  telefono,
  nombrePlantilla,
  parametros = [],
  citaId,
}) => {
  try {
    const body = {
      messaging_product: "whatsapp",
      to: telefono,
      type: "template",
      template: {
        name: nombrePlantilla,
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: parametros.map((texto) => ({
              type: "text",
              text: texto,
            })),
          },
          // Botones: el "payload" es lo que recibiremos de vuelta
          // en el webhook cuando el paciente toque el botón.
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [
              {
                type: "payload",
                payload: `CONFIRMAR_${citaId}`,
              },
            ],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [
              {
                type: "payload",
                payload: `CANCELAR_${citaId}`,
              },
            ],
          },
        ],
      },
    };

    const response = await axios.post(WHATSAPP_API_URL, body, { headers });
    return response.data;
  } catch (error) {
    console.error(
      "Error al enviar mensaje de WhatsApp:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const enviarMensajeTexto = async ({ telefono, mensaje }) => {
  try {
    const body = {
      messaging_product: "whatsapp",
      to: telefono,
      type: "text",
      text: { body: mensaje },
    };

    const response = await axios.post(WHATSAPP_API_URL, body, { headers });
    return response.data;
  } catch (error) {
    console.error(
      "Error al enviar mensaje de texto:",
      error.response?.data || error.message
    );
    throw error;
  }
};

