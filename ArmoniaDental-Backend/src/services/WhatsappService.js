import axios from "axios";
import mongoose from "mongoose";

/*
 * La URL y los headers se construyen al momento de enviar (no al importar el
 * módulo), así no dependen del orden en que dotenv.config() cargue el .env.
 */
const getApiUrl = () =>
  `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
});

/*
 * Deja el teléfono solo con dígitos y con código de país.
 * Un número de 8 dígitos se asume de Costa Rica (506).
 */
export const normalizarTelefono = (telefono = "") => {
  const digitos = String(telefono).replace(/\D/g, "");
  return digitos.length === 8 ? `506${digitos}` : digitos;
};

const enviar = async (body, mensajeError) => {
  try {
    const response = await axios.post(getApiUrl(), body, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(mensajeError, error.response?.data || error.message);
    throw error;
  }
};

/*
 * Envía una plantilla de WhatsApp.
 *
 * parametrosNombrados debe coincidir exactamente con los nombres de variable
 * definidos en la plantilla de Meta.
 * Ej: { nombre_paciente: "Juan", tipo_cita: "Limpieza", ... }
 *
 * conBotones (por defecto true): agrega los botones de respuesta rápida
 * Confirmar / Cancelar. Úsalo solo con plantillas que tengan esos 2 botones.
 */
export const enviarMensajePlantilla = async ({
  telefono,
  nombrePlantilla,
  parametrosNombrados = {},
  citaId,
  conBotones = true,
}) => {
  const parametrosBody = Object.entries(parametrosNombrados).map(
    ([nombre, valor]) => ({
      type: "text",
      parameter_name: nombre,
      text: String(valor),
    })
  );

  const components = [];

  if (parametrosBody.length > 0) {
    components.push({ type: "body", parameters: parametrosBody });
  }

  if (conBotones) {
    components.push(
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
      }
    );
  }

  const body = {
    messaging_product: "whatsapp",
    to: normalizarTelefono(telefono),
    type: "template",
    template: {
      name: nombrePlantilla,
      language: { code: "es_CR" },
      components,
    },
  };

  return enviar(body, "Error al enviar mensaje de WhatsApp:");
};

/*
 * Envía un mensaje de texto libre (solo funciona dentro
 * de las 24h después de que el usuario te escribió).
 */
export const enviarMensajeTexto = async ({ telefono, mensaje }) => {
  const body = {
    messaging_product: "whatsapp",
    to: normalizarTelefono(telefono),
    type: "text",
    text: { body: mensaje },
  };

  return enviar(body, "Error al enviar mensaje de texto:");
};

/*
 * Procesa la respuesta de un botón de WhatsApp (Confirmar/Cancelar)
 * y actualiza el estado de la cita correspondiente.
 *
 * Nota: aquí NO se llama a la notificación de cancelación del sistema,
 * porque este mismo flujo ya le responde al paciente.
 */
export const procesarRespuestaBoton = async (payload, telefonoPaciente) => {
  const CitaModel = (await import("../models/CitaModel.js")).default;

  const [accion, citaId] = String(payload).split("_");
  const responder = (mensaje) =>
    enviarMensajeTexto({ telefono: telefonoPaciente, mensaje });

  if (
    !["CONFIRMAR", "CANCELAR"].includes(accion) ||
    !mongoose.isValidObjectId(citaId)
  ) {
    console.warn(`Payload de botón no válido: ${payload}`);
    return;
  }

  const cita = await CitaModel.findById(citaId);
  if (!cita) {
    console.warn(`Cita no encontrada para el payload: ${payload}`);
    await responder(
      "No pudimos encontrar tu cita. Por favor comunícate con la clínica."
    );
    return;
  }

  // Citas que ya no admiten cambios desde WhatsApp
  if (cita.estado === "Cancelada") {
    await responder(
      accion === "CANCELAR"
        ? "Tu cita ya se encuentra cancelada."
        : "Tu cita fue cancelada. Si deseas reagendar, comunícate con la clínica."
    );
    return;
  }

  if (!["Programada", "Confirmada"].includes(cita.estado)) {
    await responder(
      "Esta cita ya no puede modificarse por este medio. Por favor comunícate con la clínica."
    );
    return;
  }

  if (accion === "CONFIRMAR") {
    if (cita.estado === "Confirmada") {
      await responder("Tu cita ya se encuentra confirmada.");
      return;
    }

    cita.estado = "Confirmada";
    await cita.save();
    await responder("¡Gracias! Tu cita ha sido confirmada. Te estaremos esperando.");
    console.log(`Cita ${citaId} confirmada por el paciente.`);
    return;
  }

  // accion === "CANCELAR" (también aplica a citas ya confirmadas)
  cita.estado = "Cancelada";
  await cita.save();
  await responder(
    "Tu cita ha sido cancelada. Si deseas reagendar, comunícate con la clínica."
  );
  console.log(`Cita ${citaId} cancelada por el paciente.`);
};