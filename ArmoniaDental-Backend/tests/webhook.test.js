import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import express from "express";
import { WhatsappRoutes } from "../src/routes/WhatsappRoutes.js";
import { capturarCuerpoWebhook } from "../src/middlewares/VerifyWebhook.js";

test("WhatsApp autentica eventos externos con firma, sin sesión de empleado", async (t) => {
  const old = { WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN };
  process.env.WHATSAPP_APP_SECRET = crypto.randomBytes(32).toString("hex");
  process.env.WHATSAPP_VERIFY_TOKEN = "verificacion-prueba";
  const app = express(); app.use(express.json({ verify: capturarCuerpoWebhook })); WhatsappRoutes(app);
  const server = app.listen(0, "127.0.0.1"); await new Promise((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise((r) => server.close(r));
    for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  });
  const url = `http://127.0.0.1:${server.address().port}/${process.env.VERSION || "v1"}/whatsapp/webhook`;
  // Empty event: no appointments or persistence are modified.
  const body = '{ "entry": [], "texto": "á" }';
  const firma = "sha256=" + crypto.createHmac("sha256", process.env.WHATSAPP_APP_SECRET).update(body).digest("hex");
  const post = (payload = body, signature) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json",
    ...(signature ? { "x-hub-signature-256": signature } : {}) }, body: payload });
  await t.test("rechaza ausencia de firma, falsificación y modificación del cuerpo", async () => {
    assert.equal((await post()).status, 403);
    assert.equal((await post(body, "sha256=" + "0".repeat(64))).status, 403);
    assert.equal((await post(body + " ", firma)).status, 403);
  });
  await t.test("acepta firma auténtica sobre bytes originales", async () => {
    assert.equal((await post(body, firma)).status, 200);
  });
  await t.test("falta de secreto no abre acceso", async () => {
    delete process.env.WHATSAPP_APP_SECRET; assert.equal((await post(body, firma)).status, 503);
  });
  await t.test("verificación GET exige token configurado", async () => {
    const valid = await fetch(url + "?hub.mode=subscribe&hub.verify_token=verificacion-prueba&hub.challenge=123");
    assert.equal(valid.status, 200); assert.equal(await valid.text(), "123");
    delete process.env.WHATSAPP_VERIFY_TOKEN;
    assert.equal((await fetch(url + "?hub.mode=subscribe&hub.challenge=123")).status, 403);
  });
});
