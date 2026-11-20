import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import axios from "axios";
import mongoose from "mongoose";
import ComprobanteModel from "../src/models/ComprobanteModel.js";
import ComprobanteFirmadoModel from "../src/models/ComprobanteFirmadoModel.js";
import PacienteModel from "../src/models/PacienteModel.js";
import {
  tieneFirmaDigital,
  obtenerArchivoComprobante,
  subirComprobanteFirmadoService,
  eliminarComprobanteFirmadoService,
  enviarWhatsappComprobanteService,
} from "../src/services/ComprobanteService.js";

const pdf = (nombre) => readFileSync(new URL(`./fixtures/${nombre}`, import.meta.url));
const ID = new mongoose.Types.ObjectId().toString();
const DRA = { _id: new mongoose.Types.ObjectId().toString(), nombre: "Dra. Laura Ureña" };
const consulta = (v) => ({ select: () => consulta(v), lean: async () => v });

// Comprobante y archivo firmado en memoria
const montar = (t, { firmado = null, telefono = "8888-7777" } = {}) => {
  const estado = {
    comp: { _id: ID, numero: "COMP-2026-000124", tipo: "Incapacidad", paciente_id: "p1", paciente_nombre: "Ana Mora",
      paciente_cedula: "1-1111-1111", fecha: new Date(Date.UTC(2026, 10, 19)), hora_inicio: "09:00", hora_fin: "10:00",
      profesional_nombre: "Dra. Laura Ureña", descripcion: "Atención odontológica.", firmado },
    archivo: firmado ? { archivo: pdf("firmado_pades.pdf") } : null,
    mensajes: [],
  };
  t.mock.method(ComprobanteModel, "findById", async () => estado.comp);
  t.mock.method(ComprobanteModel, "findByIdAndUpdate", async (id, u) => {
    Object.assign(estado.comp, u.$set);
    for (const [k, v] of Object.entries(u.$inc || {})) estado.comp[k] = (estado.comp[k] || 0) + v;
    return estado.comp;
  });
  t.mock.method(ComprobanteFirmadoModel, "findOneAndUpdate", async (f, u) => { estado.archivo = { ...u.$set }; return estado.archivo; });
  t.mock.method(ComprobanteFirmadoModel, "findOne", () => consulta(estado.archivo));
  t.mock.method(ComprobanteFirmadoModel, "deleteOne", async () => { estado.archivo = null; return { deletedCount: 1 }; });
  t.mock.method(PacienteModel, "findById", () => consulta({ telefono }));
  t.mock.method(axios, "post", async (url, body) => {
    if (url.endsWith("/media")) { estado.mensajes.push({ media: body }); return { data: { id: "MEDIA-123" } }; }
    estado.mensajes.push(body); return { data: { messages: [{ id: "wamid" }] } };
  });
  return estado;
};

const archivo = (buffer, nombre = "firmado.pdf") => ({ buffer, size: buffer.length, originalname: nombre });

test("detecta la firma digital (PKCS#7 y PAdES) y rechaza el PDF sin firmar", () => {
  assert.equal(tieneFirmaDigital(pdf("firmado_pkcs7.pdf")), true);
  assert.equal(tieneFirmaDigital(pdf("firmado_pades.pdf")), true);
  assert.equal(tieneFirmaDigital(pdf("sin_firma.pdf")), false);
});

test("subir: valida que sea un PDF firmado y de hasta 5 MB", async (t) => {
  montar(t);
  const rechaza = (a, re) => assert.rejects(subirComprobanteFirmadoService(ID, a, DRA), re);
  await rechaza(null, /Adjunte el PDF/);
  await rechaza(archivo(Buffer.from("esto no es un pdf")), /no es un PDF/);
  await rechaza(archivo(pdf("sin_firma.pdf")), /no tiene firma digital/);
  await rechaza({ ...archivo(pdf("firmado_pades.pdf")), size: 6 * 1024 * 1024 }, /5 MB/);
});

test("subir: guarda el archivo, su huella y quién lo subió", async (t) => {
  const e = montar(t);
  const r = await subirComprobanteFirmadoService(ID, archivo(pdf("firmado_pades.pdf"), "COMP-firmado.pdf"), DRA);
  assert.equal(r.firmado.nombre_original, "COMP-firmado.pdf");
  assert.equal(r.firmado.subido_por_nombre, "Dra. Laura Ureña");
  assert.ok(r.firmado.subido_en instanceof Date);
  assert.equal(e.archivo.sha256.length, 64);
  assert.equal(e.archivo.subido_por.nombre, "Dra. Laura Ureña");
});

test("qué PDF se entrega: el firmado si existe; el generado para firmar", async (t) => {
  montar(t, { firmado: { subido_en: new Date() } });
  const comp = await ComprobanteModel.findById(ID);
  const preferido = await obtenerArchivoComprobante(comp);
  assert.equal(preferido.firmado, true);
  assert.equal(preferido.nombre, "COMP-2026-000124-firmado.pdf");
  assert.ok(tieneFirmaDigital(preferido.buffer));
  const generado = await obtenerArchivoComprobante(comp, "generado");
  assert.equal(generado.firmado, false);
  assert.equal(generado.buffer.subarray(0, 5).toString(), "%PDF-");
});

test("sin versión firmada: se entrega el generado y pedir el firmado da 404", async (t) => {
  montar(t);
  const comp = await ComprobanteModel.findById(ID);
  assert.equal((await obtenerArchivoComprobante(comp)).firmado, false);
  await assert.rejects(obtenerArchivoComprobante(comp, "firmado"), (e) => e.statusCode === 404);
});

test("quitar la versión firmada", async (t) => {
  const e = montar(t, { firmado: { subido_en: new Date() } });
  const r = await eliminarComprobanteFirmadoService(ID);
  assert.equal(r.firmado, null);
  assert.equal(e.archivo, null);
});

test("WhatsApp: sube el PDF firmado y lo envía como documento de la plantilla", async (t) => {
  const e = montar(t, { firmado: { subido_en: new Date() } });
  const r = await enviarWhatsappComprobanteService(ID);
  assert.equal(e.mensajes.length, 2); // 1) subir el archivo  2) enviar la plantilla
  const plantilla = e.mensajes[1];
  assert.equal(plantilla.to, "50688887777");
  assert.equal(plantilla.template.name, "comprobante_paciente");
  const encabezado = plantilla.template.components.find((c) => c.type === "header");
  assert.deepEqual(encabezado.parameters[0].document, { id: "MEDIA-123", filename: "COMP-2026-000124-firmado.pdf" });
  const cuerpo = plantilla.template.components.find((c) => c.type === "body").parameters;
  assert.deepEqual(cuerpo.map((p) => p.parameter_name), ["nombre_paciente", "numero_comprobante"]);
  assert.equal(plantilla.template.components.some((c) => c.type === "button"), false);
  assert.equal(r.estado_whatsapp, "enviado");
  assert.equal(r.whatsapp_version_enviada, "firmado");
  assert.equal(r.cantidad_envios_whatsapp, 1);
});

test("WhatsApp: valida el teléfono, la lista de pruebas y marca el error si Meta falla", async (t) => {
  montar(t, { telefono: "" });
  await assert.rejects(enviarWhatsappComprobanteService(ID), /no tiene un teléfono/);
  await assert.rejects(enviarWhatsappComprobanteService(ID, "123"), /no es válido/);

  process.env.WHATSAPP_LISTA_BLANCA = "88880000";
  await assert.rejects(enviarWhatsappComprobanteService(ID, "8888-7777"), /lista de pruebas/);
  delete process.env.WHATSAPP_LISTA_BLANCA;

  const e = montar(t);
  axios.post.mock.mockImplementation(async () => { throw Object.assign(new Error("Template no aprobada"), { response: { data: { error: { code: 132001 } } } }); });
  await assert.rejects(enviarWhatsappComprobanteService(ID), (err) => err.statusCode === 502);
  assert.equal(e.comp.estado_whatsapp, "error");
});
