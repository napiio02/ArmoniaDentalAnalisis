import crypto from "node:crypto";

// El webhook es una entrada de Meta, no una ruta de sesión de empleados.
export const capturarCuerpoWebhook = (req, res, buffer) => {
  if (req.originalUrl.split("?")[0].endsWith("/whatsapp/webhook")) req.rawBody = Buffer.from(buffer);
};
export const verifyWebhook = (req, res, next) => {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return res.status(503).json({ message: "El webhook de WhatsApp no está configurado." });
  const firma = req.get("x-hub-signature-256");
  if (!Buffer.isBuffer(req.rawBody) || !/^sha256=[a-f0-9]{64}$/.test(firma || "")) {
    return res.status(403).json({ message: "Firma de webhook inválida." });
  }
  const recibida = Buffer.from(firma.slice(7), "hex");
  const esperada = crypto.createHmac("sha256", secret).update(req.rawBody).digest();
  if (!crypto.timingSafeEqual(recibida, esperada)) return res.status(403).json({ message: "Firma de webhook inválida." });
  next();
};
