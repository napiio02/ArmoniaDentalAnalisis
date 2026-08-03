import { procesarRespuestaBoton } from "../services/WhatsappService.js";

/*
 * Meta llama a este endpoint UNA VEZ, por GET, para verificar
 * que el webhook es tuyo, cuando lo registras en el dashboard.
 */
export const verificarWebhook = (req, res) => {
  const modo = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const desafio = req.query["hub.challenge"];

  console.log("Modo recibido:", modo);
  console.log("Token recibido:", token);
  console.log("Token esperado:", process.env.WHATSAPP_VERIFY_TOKEN);

  if (modo === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Webhook de WhatsApp verificado correctamente.");
    return res.status(200).send(desafio);
  }

  return res.sendStatus(403);
};

/*
 * Meta llama a este endpoint por POST cada vez que hay un evento
 * (mensaje recibido, botón presionado, cambio de estado, etc.).
 */
export const recibirWebhook = async (req, res) => {
  try {
    res.sendStatus(200);

    const entrada = req.body?.entry?.[0];
    const cambio = entrada?.changes?.[0];
    const mensaje = cambio?.value?.messages?.[0];

    if (!mensaje) return;

    // Botón de PLANTILLA (quick_reply)
    if (mensaje.type === "button") {
      await procesarRespuestaBoton(mensaje.button.payload);
      return;
    }

    // Botón INTERACTIVO (mensaje de sesión, sin plantilla)
    if (mensaje.type === "interactive" && mensaje.interactive?.type === "button_reply") {
      await procesarRespuestaBoton(mensaje.interactive.button_reply.id);
      return;
    }

    if (mensaje.type === "text") {
      console.log(`Mensaje de texto recibido de ${mensaje.from}: ${mensaje.text.body}`);
    }
  } catch (error) {
    console.error("Error procesando webhook de WhatsApp:", error);
  }
};