import { verifyWebhook } from "../middlewares/VerifyWebhook.js";
import { verificarWebhook, recibirWebhook } from "../controllers/WhatsappController.js";

export const WhatsappRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  // Meta verifica la suscripción con su token y firma cada notificación.
  app.get(`/${version}/whatsapp/webhook`, verificarWebhook);
  app.post(`/${version}/whatsapp/webhook`, verifyWebhook, recibirWebhook);
};