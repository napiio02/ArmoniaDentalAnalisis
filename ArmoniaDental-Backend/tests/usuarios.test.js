import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import Usuario from "../src/models/Usuario.js";
import Rol from "../src/models/Roles.js";
import Marca from "../src/models/MarcaModel.js";
import Cita from "../src/models/CitaModel.js";
import Comprobante from "../src/models/ComprobanteModel.js";
import Odontograma from "../src/models/Odontograma/OdontogramaModel.js";
import Historial from "../src/models/Odontograma/HistorialModel.js";
import { UsersRoutes } from "../src/routes/UsuariosRoutes.js";
import { RolesRoutes } from "../src/routes/RolesRoutes.js";
import { AuthRoutes } from "../src/routes/AuthRoutes.js";

// Routes, controllers, services, schemas, JWT and bcrypt are real.
// Only persistence is replaced; no MongoDB connection or existing data is used.
test("Administración: CRUD, roles, login and validation through HTTP", async (t) => {
  const originales = { find: Usuario.find, findOne: Usuario.findOne, findById: Usuario.findById,
    create: Usuario.create, findByIdAndUpdate: Usuario.findByIdAndUpdate,
    findByIdAndDelete: Usuario.findByIdAndDelete, rolFind: Rol.find, rolFindById: Rol.findById,
    exec: mongoose.Query.prototype.exec };
  const entorno = { VERSION: process.env.VERSION, JWT_SECRET: process.env.JWT_SECRET };
  process.env.VERSION = "v1";
  process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
  const roles = ["Admin", "Dentista", "Asistente Dental"].map((nombre) => ({
    _id: new mongoose.Types.ObjectId().toString(), nombre, descripcion: nombre, activo: true,
  }));
  const registros = new Map();
  const modelosReferencias = [Marca, Cita, Comprobante, Odontograma, Historial];
  const existsOriginales = modelosReferencias.map((modelo) => modelo.exists);
  const usuariosConHistorial = new Set();
  for (const modelo of modelosReferencias) {
    modelo.exists = async (filter) => {
      const id = Object.values(filter.$or?.[0] || filter)[0];
      return usuariosConHistorial.has(id) ? { _id: "referencia" } : null;
    };
  }
  const adaptar = (raw, incluirPassword = false, poblar = false) => {
    if (!raw) return null;
    const result = { ...raw };
    if (!incluirPassword) delete result.password_hash;
    delete result.reset_password_token_hash;
    delete result.reset_password_expires_at;
    if (poblar) result.rol_id = roles.find((r) => r._id === String(raw.rol_id)) || null;
    Object.defineProperty(result, "save", { enumerable: false, value: async () => {
      const { rol_id, ...datos } = result;
      Object.assign(raw, datos, { rol_id: rol_id?._id || rol_id });
    } });
    return result;
  };
  const query = (obtener) => {
    let incluir = false, poblar = false;
    const q = { select(value) { incluir = value.includes("+password_hash"); return q; },
      populate() { poblar = true; return q; }, sort() { return q; },
      then(resolve, reject) { return Promise.resolve().then(() => {
        const raw = obtener();
        return Array.isArray(raw) ? raw.map((r) => adaptar(r, incluir, poblar)) : adaptar(raw, incluir, poblar);
      }).then(resolve, reject); } };
    return q;
  };
  mongoose.Query.prototype.exec = async () => { throw new Error("Real database calls forbidden in this test"); };
  Usuario.find = () => query(() => [...registros.values()]);
  Usuario.findById = (id) => query(() => registros.get(String(id)));
  Usuario.findOne = (filter) => query(() => [...registros.values()].find((r) =>
    Object.entries(filter).every(([key, value]) => key === "_id" && value.$ne
      ? r._id !== value.$ne : r[key] === value)));
  Usuario.create = async (data) => {
    const doc = new Usuario(data);
    await doc.validate();
    const raw = doc.toObject();
    raw._id = String(raw._id); raw.rol_id = String(raw.rol_id);
    registros.set(raw._id, raw);
    return raw;
  };
  Usuario.findByIdAndUpdate = (id, data) => query(() => {
    const raw = registros.get(String(id));
    if (!raw) return null;
    Object.assign(raw, data); return raw;
  });
  Usuario.findByIdAndDelete = async (id) => {
    const raw = registros.get(String(id)); registros.delete(String(id)); return raw || null;
  };
  Rol.findById = async (id) => roles.find((r) => r._id === String(id)) || null;
  Rol.find = async (filter) => roles.filter((r) => filter.nombre.$in.includes(r.nombre) && r.activo === filter.activo);
  const inicial = await Usuario.create({ nombre: "Operador", email: "operador@example.invalid", cedula: "OPERADOR", telefono: "00000000",
    rol_id: roles[0]._id, estado_cuenta: "Activa", password_hash: await bcrypt.hash("Operador123!", 10) });
  const app = express(); app.use(express.json()); app.use(cookieParser());
  AuthRoutes(app); UsersRoutes(app); RolesRoutes(app);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    Object.assign(Usuario, { find: originales.find, findOne: originales.findOne, findById: originales.findById,
      create: originales.create, findByIdAndUpdate: originales.findByIdAndUpdate, findByIdAndDelete: originales.findByIdAndDelete });
    Rol.find = originales.rolFind; Rol.findById = originales.rolFindById;
    mongoose.Query.prototype.exec = originales.exec;
    modelosReferencias.forEach((modelo, index) => { modelo.exists = existsOriginales[index]; });
    for (const [key, value] of Object.entries(entorno)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  });
  const base = `http://127.0.0.1:${server.address().port}/v1`;
  let cookie = "";
  const request = async (ruta, method = "GET", body, conSesion = true) => {
    const res = await fetch(base + ruta, { method, headers: { "Content-Type": "application/json", ...(conSesion && cookie ? { Cookie: cookie } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: res.status, body: await res.json(), cookie: res.headers.get("set-cookie")?.split(";")[0] };
  };
  await t.test("requires a session and uses existing login", async () => {
    assert.equal((await request("/users/list")).status, 401);
    const login = await request("/auth/login", "POST", { email: inicial.email, password: "Operador123!" });
    assert.equal(login.status, 200); cookie = login.cookie; assert.ok(cookie);
  });
  await t.test("lists all three existing roles", async () => {
    const res = await request("/roles/list"); assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((r) => r.nombre), ["Admin", "Dentista", "Asistente Dental"]);
  });
  const ids = [];
  await t.test("creates a usable account for each role without exposing password hashes", async () => {
    for (const [index, rol] of roles.entries()) {
      const res = await request("/users", "POST", { nombre: `Usuario ${index}`, email: `  NUEVO${index}@example.invalid  `,
        cedula: `CEDULA${index}`, telefono: "88888888", rol_id: rol._id, password: "Inicial123!", activo: true });
      assert.equal(res.status, 201); ids.push(res.body.usuario._id);
      assert.equal(res.body.usuario.estado_cuenta, "Activa"); assert.equal(res.body.usuario.rol_id.nombre, rol.nombre);
      assert.equal(res.body.usuario.password_hash, undefined);
      assert.equal(await bcrypt.compare("Inicial123!", registros.get(ids[index]).password_hash), true);
      assert.equal((await request("/auth/login", "POST", { email: `nuevo${index}@example.invalid`, password: "Inicial123!" })).status, 200);
    }
    const list = await request("/users/list"); assert.equal(list.body.length, 4);
    assert.ok(list.body.every((u) => !u.password_hash));
  });
  await t.test("reads details, edits fields and role, preserves password", async () => {
    assert.equal((await request(`/users/info/${ids[0]}`)).body.nombre, "Usuario 0");
    const hash = registros.get(ids[0]).password_hash;
    const res = await request(`/users/${ids[0]}`, "PUT", { nombre: "Nombre editado", email: "editado@example.invalid", cedula: "EDITADA", telefono: "77777777", rol_id: roles[1]._id });
    assert.equal(res.status, 200); assert.equal(res.body.usuario.nombre, "Nombre editado");
    assert.equal(res.body.usuario.rol_id.nombre, "Dentista"); assert.equal(registros.get(ids[0]).password_hash, hash);
  });
  await t.test("deactivates and reactivates persistently, with expected login behavior", async () => {
    assert.equal((await request(`/users/${ids[0]}/status`, "PATCH", { activo: false })).body.usuario.activo, false);
    assert.equal((await request(`/users/info/${ids[0]}`)).body.activo, false);
    assert.equal((await request("/auth/login", "POST", { email: "editado@example.invalid", password: "Inicial123!" })).status, 403);
    assert.equal((await request(`/users/${ids[0]}/status`, "PATCH", { activo: true })).body.usuario.activo, true);
    assert.equal((await request("/auth/login", "POST", { email: "editado@example.invalid", password: "Inicial123!" })).status, 200);
  });
  await t.test("rejects duplicates, invalid roles, empty fields and malformed requests", async () => {
    const data = { nombre: "Prueba", email: "otro@example.invalid", cedula: "OTRA", telefono: "88888888", rol_id: roles[0]._id, password: "Inicial123!" };
    for (const fields of [{ email: "editado@example.invalid" }, { cedula: "EDITADA" }]) assert.equal((await request("/users", "POST", { ...data, ...fields })).status, 409);
    for (const fields of [{ nombre: "  " }, { email: "incorrecto" }, { password: "corta" }, { password: "á".repeat(40) }, { activo: "false" }, { rol_id: new mongoose.Types.ObjectId().toString() }]) {
      assert.equal((await request("/users", "POST", { ...data, ...fields })).status, 400);
    }
    assert.equal((await request(`/users/${ids[0]}`, "PUT", { email: "nuevo1@example.invalid" })).status, 409);
    assert.equal((await request(`/users/${ids[0]}`, "PUT", { cedula: "CEDULA1" })).status, 409);
    assert.equal((await request(`/users/${ids[0]}`, "PUT", { nombre: " " })).status, 400);
    roles[1].activo = false;
    assert.equal((await request("/users", "POST", { ...data, rol_id: roles[1]._id })).status, 400);
    roles[1].activo = true;
    assert.equal((await request(`/users/${ids[0]}/status`, "PATCH", {})).status, 400);
    assert.equal((await request(`/users/${ids[0]}/status`, "PATCH")).status, 400);
    assert.equal((await request("/users", "POST")).status, 400);
    assert.equal((await request("/users/info/invalid")).status, 400);
    assert.equal((await request(`/users/info/${new mongoose.Types.ObjectId()}`)).status, 404);
  });
  await t.test("preserves users referenced by historical records", async () => {
    usuariosConHistorial.add(ids[1]);
    const res = await request(`/users/${ids[1]}`, "DELETE");
    assert.equal(res.status, 409);
    assert.equal((await request(`/users/info/${ids[1]}`)).status, 200);
    assert.equal((await request(`/users/${ids[1]}/status`, "PATCH", { activo: false })).status, 200);
  });
  await t.test("deletes the selected user", async () => {
    assert.equal((await request(`/users/${ids[2]}`, "DELETE")).status, 200);
    assert.equal((await request(`/users/info/${ids[2]}`)).status, 404);
    assert.equal((await request("/users/list")).body.length, 3);
  });
});
