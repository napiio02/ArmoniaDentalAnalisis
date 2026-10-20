import { procesarRespuestaBoton } from "../services/WhatsappService.js";

export const verificarWebhook = (req, res) => {
  const modo = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const desafio = req.query["hub.challenge"];

  if (modo === "subscribe" && typeof token === "string" && process.env.WHATSAPP_VERIFY_TOKEN && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Webhook de WhatsApp verificado correctamente.");
    return res.status(200).send(desafio);
  }

  console.warn("[WhatsApp] Verificación del webhook rechazada: revisa WHATSAPP_VERIFY_TOKEN.");
  return res.sendStatus(403);
};

// Un mensaje recibido: botón de plantilla (quick_reply) o botón interactivo
const procesarMensaje = async (mensaje) => {
  if (mensaje.type === "button") {
    await procesarRespuestaBoton(mensaje.button?.payload, mensaje.from);
    return;
  }

  if (mensaje.type === "interactive" && mensaje.interactive?.type === "button_reply") {
    await procesarRespuestaBoton(mensaje.interactive.button_reply?.id, mensaje.from);
    return;
  }

  if (mensaje.type === "text") {
    console.log(`Mensaje de texto recibido de ${mensaje.from}: ${mensaje.text?.body}`);
  }
};

export const recibirWebhook = async (req, res) => {
  // Meta exige responder rápido; el procesamiento sigue después
  res.sendStatus(200);

  try {
    // Meta puede agrupar varios eventos en una misma notificación
    for (const entrada of req.body?.entry ?? []) {
      for (const cambio of entrada?.changes ?? []) {
        const valor = cambio?.value ?? {};

        // Estado de los mensajes enviados: aquí aparece el motivo cuando un mensaje no se entrega
        for (const estado of valor.statuses ?? []) {
          if (estado.status === "failed") {
            const detalle = (estado.errors ?? []).map((e) => `${e.code} ${e.title}`).join("; ");
            console.warn(`[WhatsApp] Mensaje ${estado.id} a ${estado.recipient_id} FALLÓ: ${detalle}`);
          }
        }

        for (const mensaje of valor.messages ?? []) {
          try {
            await procesarMensaje(mensaje);
          } catch (error) {
            console.error("Error procesando un mensaje de WhatsApp:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error procesando webhook de WhatsApp:", error);
  }
};
