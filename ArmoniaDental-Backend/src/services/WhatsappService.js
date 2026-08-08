import axios from "axios";

const WHATSAPP_API_URL = `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

const headers = {
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
};


/*
 * Envía la plantilla de confirmación de cita con botones
 * de respuesta rápida (Confirmar / Cancelar).
 *
 * parametrosNombrados debe coincidir exactamente con los
 * nombres de variable definidos en la plantilla de Meta.
 * Ej: { nombre_paciente: "Juan", tipo_cita: "Limpieza", ... }
 */
export const enviarMensajePlantilla = async ({
  telefono,
  nombrePlantilla,
  parametrosNombrados = {},
  citaId,
}) => {
  try {
    const parametrosBody = Object.entries(parametrosNombrados).map(
      ([nombre, valor]) => ({
        type: "text",
        parameter_name: nombre,
        text: String(valor),
      })
    );

    const body = {
      messaging_product: "whatsapp",
      to: telefono,
      type: "template",
      template: {
        name: nombrePlantilla,
        language: { code: "es_CR" },
        components: [
          {
            type: "body",
            parameters: parametrosBody,
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [{ type: "payload", payload: `CONFIRMAR_${citaId}` }],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [{ type: "payload", payload: `CANCELAR_${citaId}` }],
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

/*
 * Envía un mensaje de texto libre (solo funciona dentro
 * de las 24h después de que el usuario te escribió).
 */
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

/*
 * Procesa la respuesta de un botón de WhatsApp (Confirmar/Cancelar)
 * y actualiza el estado de la cita correspondiente.
 */
export const procesarRespuestaBoton = async (payload, telefonoPaciente) => {
  const CitaModel = (await import("../models/CitaModel.js")).default;

  const [accion, citaId] = payload.split("_");
  
  

  const cita = await CitaModel.findById(citaId);
  if (!cita) {
    console.warn(`Cita no encontrada para el payload: ${payload}`);
    await enviarMensajeTexto({
        telefono: telefonoPaciente,
        mensaje: "No pudimos encontrar tu cita. Por favor comunícate con la clínica.",
      });
    return;
  }

  if (accion === "CONFIRMAR") {
    cita.estado = "Confirmada";
    await cita.save();
    await enviarMensajeTexto({
        telefono: telefonoPaciente,
        mensaje: "¡Gracias! Tu cita ha sido confirmada. Te estaremos esperando.",
      });
    console.log(`Cita ${citaId} confirmada por el paciente.`);
  } else if (accion === "CANCELAR") {
    cita.estado = "Cancelada";
    await cita.save();
    await enviarMensajeTexto({
        telefono: telefonoPaciente,
        mensaje: "Tu cita ha sido cancelada. Si deseas reagendar, comunícate con la clínica.",
      });
    console.log(`Cita ${citaId} cancelada por el paciente.`);
  }
};