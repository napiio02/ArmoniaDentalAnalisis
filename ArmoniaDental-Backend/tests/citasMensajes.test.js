import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import CitaModel from "../src/models/CitaModel.js";
import ConfiguracionAgendaModel from "../src/models/ConfiguracionAgendaModel.js";
import { crearCitaService } from "../src/services/CitasServices.js";

// Consulta falsa encadenable (.populate().lean() / await directo)
const consulta = (valor) => {
  const q = { populate: () => q, lean: async () => valor, select: () => q, sort: () => q,
    then: (ok, err) => Promise.resolve(valor).then(ok, err) };
  return q;
};
const espera = () => new Promise((r) => setTimeout(r, 30));
const enHoras = (h) => new Date(Date.now() + h * 3600000);

const preparar = (t, fecha_hora) => {
  const enviados = [];
  let guardada = null;
  t.mock.method(axios, "post", async (url, body) => { enviados.push(body); return { data: {} }; });
  t.mock.method(ConfiguracionAgendaModel, "findOneAndUpdate", () =>
    consulta({ horaInicio: "00:00", horaFin: "23:59", diasNoLaborables: [], fechasNoLaborables: [] }));
  t.mock.method(CitaModel, "find", () => consulta([])); // sin choques de horario
  t.mock.method(CitaModel, "create", async (d) => { guardada = { _id: "650000000000000000000001", ...d }; return guardada; });
  const poblada = () => ({ ...guardada, paciente_id: { nombre: "Ana Mora", telefono: "8888-7777" }, usuario_id: {} });
  t.mock.method(CitaModel, "findById", () => consulta(poblada()));
  t.mock.method(CitaModel, "findOneAndUpdate", async () => guardada); // reclama el recordatorio
  const plantillas = () => enviados.map((b) => ({ nombre: b.template.name, botones: b.template.components.some((c) => c.type === "button") }));
  return { crear: () => crearCitaService({ paciente_id: "p", usuario_id: "u", tipo: "Revisión", motivo: "x", fecha_hora }), plantillas, guardada: () => guardada };
};

test("cita para el mismo día: queda Confirmada y recibe la confirmación sin botones", async (t) => {
  // Dentro de 1 hora, siempre que no cruce la medianoche de Costa Rica
  const horaCR = Number(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica", hour: "numeric", hour12: false }));
  if (horaCR >= 22) return t.skip("cerca de la medianoche en Costa Rica");
  const p = preparar(t, enHoras(1).toISOString());
  await p.crear(); await espera();
  assert.equal(p.guardada().estado, "Confirmada");
  assert.equal(p.guardada().recordatorioVisperaEnviado, true);
  assert.deepEqual(p.plantillas(), [{ nombre: "confirmacion_cita", botones: false }]);
});

test("cita con varios días de anticipación: no recibe mensaje al agendar (solo el recordatorio la víspera)", async (t) => {
  const p = preparar(t, enHoras(24 * 5).toISOString());
  await p.crear(); await espera();
  assert.equal(p.guardada().estado, "Programada");
  assert.equal(p.guardada().recordatorioVisperaEnviado, false);
  assert.deepEqual(p.plantillas(), []);
});

test("cita para mañana agendada después de la hora del recordatorio: el recordatorio sale de inmediato, con botones", async (t) => {
  // Mañana a las 9 p. m. de Costa Rica: su víspera (hoy 4 p. m.) ya pasó si ahora son más de las 4 p. m.
  const hoyCR = new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
  const manana = new Date(new Date(`${hoyCR}T12:00:00-06:00`).getTime() + 86400000).toLocaleDateString("en-CA");
  const horaCR = Number(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica", hour: "numeric", hour12: false }));
  if (horaCR < 16) return t.skip("solo aplica después de las 4 p. m. de Costa Rica");
  const p = preparar(t, `${manana}T21:00:00-06:00`);
  await p.crear(); await espera();
  assert.deepEqual(p.plantillas(), [{ nombre: "recordatorio_cita", botones: true }]);
});
