import cron from "node-cron";
import { enviarRecordatoriosPendientes } from "../services/RecordatorioService.js";

let enEjecucion = false;

/*
 * Ejecuta una pasada de recordatorios. Evita solaparse con una corrida
 * anterior que siga en curso.
 */
export const ejecutarRecordatorios = async () => {
  if (enEjecucion) return null;
  enEjecucion = true;

  try {
    const resultado = await enviarRecordatoriosPendientes();
    const { recordatorio24: r24, recordatorio12: r12 } = resultado;

    if (r24.encontradas || r12.encontradas) {
      console.log(
        `[Recordatorios] 24h: ${r24.enviados} enviados, ${r24.fallidos} fallidos | ` +
          `12h: ${r12.enviados} enviados, ${r12.fallidos} fallidos`
      );
    }

    return resultado;
  } catch (error) {
    console.error("[Recordatorios] Error en la ejecución:", error.message);
    return null;
  } finally {
    enEjecucion = false;
  }
};

/* Programa el job interno: cada 10 minutos. */
export const iniciarJobRecordatorios = () => {
  cron.schedule("*/10 * * * *", ejecutarRecordatorios, {
    timezone: "America/Costa_Rica",
  });
  console.log("[Recordatorios] Job programado (cada 10 minutos).");
};

/*
 * Endpoint opcional para un cron EXTERNO (necesario si Render duerme la
 * instancia). Se protege con el header x-cron-secret = process.env.CRON_SECRET.
 */
export const RecordatoriosRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.post(`/${version}/recordatorios/ejecutar`, async (req, res) => {
    const secreto = process.env.CRON_SECRET;

    if (!secreto || req.headers["x-cron-secret"] !== secreto) {
      return res.status(401).json({ ok: false, message: "No autorizado." });
    }

    const resultado = await ejecutarRecordatorios();
    return res.status(200).json({ ok: true, data: resultado });
  });
};