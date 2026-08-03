import { verificarWebhook, recibirWebhook } from "../controllers/WhatsappController.js";

export const WhatsappRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  // Estas rutas son PÚBLICAS (Meta las llama directamente, sin tu JWT)
  app.get(`/${version}/whatsapp/webhook`, verificarWebhook);
  app.post(`/${version}/whatsapp/webhook`, recibirWebhook);
};