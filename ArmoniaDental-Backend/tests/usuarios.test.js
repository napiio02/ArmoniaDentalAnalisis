import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import Usuario from "../src/models/Usuario.js";
import Rol from "../src/models/Roles.js";
import Sesion from "../src/models/Sesion.js";
import Marca from "../src/models/MarcaModel.js";
import Cita from "../src/models/CitaModel.js";
import Comprobante from "../src/models/ComprobanteModel.js";
import Odontograma from "../src/models/Odontograma/OdontogramaModel.js";
import Historial from "../src/models/Odontograma/HistorialModel.js";
import { UsersRoutes } from "../src/routes/UsuariosRoutes.js";
import { RolesRoutes } from "../src/routes/RolesRoutes.js";
import { AuthRoutes } from "../src/routes/AuthRoutes.js";
import { InsumosRoutes } from "../src/routes/InsumosRoutes.js";
import { PacientesRoutes } from "../src/routes/PacientesRoutes.js";
import { CitasRoutes } from "../src/routes/CitasRoutes.js";
import { DocumentosExpedienteRoutes } from "../src/routes/DocumentosExpedienteRoutes.js";
import { ExpedientesRoutes } from "../src/routes/ExpedientesRoutes.js";
import { HistoriaClinicaRoutes } from "../src/routes/HistoriaClinicaRoutes.js";
import { OdontogramaRoutes } from "../src/routes/Odontograma/OdontogramaRoutes.js";
import { MarcaRoutes } from "../src/routes/MarcaRoutes.js";
import { ComprobantesRoutes } from "../src/routes/ComprobantesRoutes.js";
import { ReportesRoutes } from "../src/routes/ReportesRoutes.js";
import { crearSesion } from "../src/services/SesionService.js";
import { prepararSeguridad } from "../src/services/AdministradorService.js";

// HTTP, middleware, CRUD, login, JWT, bcrypt and schemas are real. Persistence is
// replaced with isolated stores: these tests NEVER connect to existing MongoDB.
test("Seguridad y Administración a través de HTTP", async (t) => {
  const restaurar = [];
  const stub = (obj, key, value) => { const old = obj[key]; restaurar.push(() => { obj[key] = old; }); obj[key] = value; };
  const entorno = { VERSION: process.env.VERSION, JWT_SECRET: process.env.JWT_SECRET, JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN };
  process.env.VERSION = "v1"; process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex"); process.env.JWT_EXPIRES_IN = "8h";
  stub(console, "error", () => {});
  stub(mongoose.Query.prototype, "exec", async () => { throw new Error("Real database calls forbidden"); });
  const roles = ["Admin", "Dentista", "Asistente Dental"].map((nombre) => ({
    _id: String(new mongoose.Types.ObjectId()), nombre, descripcion: nombre, activo: true,
  }));
  const usuarios = new Map(), sesiones = new Map(), historial = new Set();
  const igual = (a, b) => String(a) === String(b);
  const coincide = (raw, filter = {}) => !!raw && Object.entries(filter).every(([key, value]) => {
    if (key === "$or") return value.some((f) => coincide(raw, f));
    const actual = raw[key];
    if (value && typeof value === "object" && !(value instanceof Date) && !value._bsontype) {
      return Object.entries(value).every(([op, val]) => {
        if (op === "$ne") return !igual(actual ?? null, val);
        if (op === "$in") return val.some((v) => igual(actual, v));
        if (op === "$exists") return (actual !== undefined) === val;
        if (op === "$gt") return actual > val;
        if (op === "$lte") return actual <= val;
        if (op === "$lt") return actual < val;
        throw new Error(`Unsupported test operator: ${op}`);
      });
    }
    return igual(actual ?? null, value);
  });
  const actualizar = (raw, update) => {
    Object.assign(raw, update.$set || update);
    for (const [key, val] of Object.entries(update.$inc || {})) raw[key] = (raw[key] || 0) + val;
    return raw;
  };
  const query = (obtener, adaptarUsuarios = true) => {
    let seleccion = "", poblar = false;
    const adaptar = (raw) => {
      if (!raw) return null;
      const result = { ...raw };
      if (adaptarUsuarios) {
        for (const campo of ["password_hash", "reset_password_token_hash", "reset_password_expires_at"]) {
          if (!seleccion.includes(`+${campo}`)) delete result[campo];
        }
        if (seleccion && !seleccion.startsWith("+")) {
          for (const key of Object.keys(result)) if (key !== "_id" && !seleccion.split(" ").includes(key)) delete result[key];
        }
        if (poblar) result.rol_id = roles.find((r) => igual(r._id, raw.rol_id)) || null;
        Object.defineProperty(result, "save", { enumerable: false, value: async () => {
          const { rol_id, ...datos } = result; Object.assign(raw, datos, { rol_id: rol_id?._id || rol_id });
        } });
      }
      return result;
    };
    const q = { select(value) { seleccion = value; return q; }, populate() { poblar = true; return q; }, sort() { return q; },
      then(resolve, reject) { return Promise.resolve().then(() => {
        const raw = obtener(); return Array.isArray(raw) ? raw.map(adaptar) : adaptar(raw);
      }).then(resolve, reject); } };
    return q;
  };
  stub(Usuario, "find", (filter) => query(() => [...usuarios.values()].filter((r) => coincide(r, filter))));
  stub(Usuario, "findById", (id) => query(() => usuarios.get(String(id).toLowerCase())));
  stub(Usuario, "findOne", (filter) => query(() => [...usuarios.values()].find((r) => coincide(r, filter))));
  stub(Usuario, "create", async (data) => {
    const doc = new Usuario(data); await doc.validate();
    const raw = doc.toObject(); raw._id = String(raw._id); raw.rol_id = String(raw.rol_id); usuarios.set(raw._id, raw); return raw;
  });
  stub(Usuario, "findByIdAndUpdate", (id, update) => query(() => {
    const raw = usuarios.get(String(id).toLowerCase()); return raw ? actualizar(raw, update) : null;
  }));
  stub(Usuario, "updateOne", async (filter, update) => {
    const raw = [...usuarios.values()].find((r) => coincide(r, filter)); if (raw) actualizar(raw, update);
    return { matchedCount: raw ? 1 : 0 };
  });
  stub(Usuario, "findByIdAndDelete", async (id) => { const raw = usuarios.get(String(id).toLowerCase()); usuarios.delete(String(id)); return raw || null; });
  stub(Rol, "findById", async (id) => roles.find((r) => igual(r._id, id)) || null);
  stub(Rol, "find", async (filter) => roles.filter((r) => coincide(r, filter)));
  stub(Sesion, "create", async (data) => { const doc = new Sesion(data); await doc.validate(); sesiones.set(data._id, data); return data; });
  stub(Sesion, "findOne", (filter) => query(() => [...sesiones.values()].find((s) => coincide(s, filter)), false));
  stub(Sesion, "findOneAndUpdate", async (filter, update) => {
    const raw = sesiones.get(filter._id);
    if (raw && !coincide(raw, filter)) throw Object.assign(new Error("Duplicate admin slot"), { code: 11000 });
    const nuevo = actualizar(raw || { _id: filter._id }, update); sesiones.set(filter._id, nuevo); return nuevo;
  });
  stub(Sesion, "updateOne", async (filter, update) => {
    const raw = [...sesiones.values()].find((s) => coincide(s, filter)); if (raw) actualizar(raw, update); return { matchedCount: raw ? 1 : 0 };
  });
  stub(Sesion, "updateMany", async (filter, update) => {
    for (const raw of sesiones.values()) if (coincide(raw, filter)) actualizar(raw, update);
  });
  stub(Sesion, "init", async () => {});
  let indice;
  stub(Usuario.collection, "createIndex", async (keys, options) => { indice = { keys, options }; });
  for (const modelo of [Marca, Cita, Comprobante, Odontograma, Historial]) stub(modelo, "exists", async (filter) =>
    historial.has(String(Object.values(filter.$or?.[0] || filter)[0])) ? { _id: "reference" } : null);
  const password = "Inicial123!";
  const admin = await Usuario.create({ nombre: "Administrador", email: "admin@example.invalid", cedula: "ADMIN", telefono: "88888888",
    rol_id: roles[0]._id, estado_cuenta: "Activa", password_hash: await bcrypt.hash(password, 10) });
  const app = express(); app.use(express.json()); app.use(cookieParser());
  AuthRoutes(app); UsersRoutes(app); RolesRoutes(app);
  // For module permission tests the last controller is a sentinel, so no domain
  // persistence is needed. Every registered real authentication/authorization
  // middleware still runs, including authentication before multipart upload.
  const privadas = [];
  const registrar = Object.fromEntries(["get", "post", "put", "patch", "delete"].map((method) => [method, (path, ...handlers) => {
    privadas.push({ method: method.toUpperCase(), path });
    app[method](path, ...handlers.slice(0, -1), (req, res) => res.json({ autorizado: true, rol: req.user.rol }));
  }]));
  for (const rutas of [InsumosRoutes, PacientesRoutes, CitasRoutes, DocumentosExpedienteRoutes, ExpedientesRoutes,
    HistoriaClinicaRoutes, OdontogramaRoutes, ComprobantesRoutes, ReportesRoutes]) rutas(registrar);
  // Marca controllers have additional business permissions; tested separately below.
  MarcaRoutes(app);
  const server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    restaurar.reverse().forEach((fn) => fn());
    for (const [key, value] of Object.entries(entorno)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookieAdmin;
  const request = async (path, method = "GET", body, cookie = cookieAdmin, token) => {
    const res = await fetch(base + (path.startsWith("/api/") ? path : "/v1" + path), { method,
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: res.status, body: await res.json(), cookie: res.headers.get("set-cookie")?.split(";")[0] };
  };
  const login = (email = admin.email) => request("/auth/login", "POST", { email, password }, null);
  const tokenCookie = (cookie) => decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1));
  const staff = [];
  const crear = (index, extra = {}) => ({ nombre: `Usuario ${index}`, email: `nuevo${index}@example.invalid`, cedula: `CEDULA${index}`,
    telefono: "88888888", rol_id: roles[index]._id, password, activo: true, ...extra });

  await t.test("arranque exige Admin único válido e instala índice parcial", async () => {
    await prepararSeguridad(); assert.deepEqual(indice.keys, { rol_id: 1 }); assert.equal(indice.options.unique, true);
    assert.deepEqual(indice.options.partialFilterExpression, { rol_id: roles[0]._id });
    const duplicado = await Usuario.create({ ...crear(0), estado_cuenta: "Activa", password_hash: admin.password_hash });
    await assert.rejects(prepararSeguridad, /exactamente un usuario Admin/); usuarios.delete(duplicado._id);
    admin.activo = false; await assert.rejects(prepararSeguridad, /exactamente un usuario Admin/); admin.activo = true;
    roles[0].activo = false; await assert.rejects(prepararSeguridad, /exactamente un rol Admin/); roles[0].activo = true;
  });
  await t.test("todas las rutas privadas autentican antes de ejecutar controladores", async () => {
    for (const { path, method } of privadas) {
      const ruta = path.replace(/^\/v1/, "").replace(/:[A-Za-z_]+/g, admin._id);
      assert.equal((await request(ruta, method, method === "GET" ? undefined : {}, null)).status, 401, `${method} ${path}`);
    }
    for (const path of ["/users/list", "/roles/list", "/personal", "/marcas", "/marcas/resumen", "/marcas/pendientes"]) {
      assert.equal((await request(path, "GET", undefined, null)).status, 401, path);
    }
    assert.equal((await request("/auth/registro", "POST", {}, null)).status, 401);
    cookieAdmin = (await login()).cookie; assert.ok(cookieAdmin);
    assert.equal((await request("/auth/me")).body.data.usuario.rol, "Admin");
  });
  await t.test("lista los tres roles, crea Dentista y Asistente con contraseña utilizable", async () => {
    assert.deepEqual((await request("/roles/list")).body.map((r) => r.nombre), ["Admin", "Dentista", "Asistente Dental"]);
    for (const index of [1, 2]) {
      const res = await request("/users", "POST", crear(index, { email: ` NUEVO${index}@example.invalid ` }));
      assert.equal(res.status, 201); assert.equal(res.body.usuario.password_hash, undefined);
      const u = res.body.usuario; assert.equal(u.rol_id.nombre, roles[index].nombre);
      assert.equal(await bcrypt.compare(password, usuarios.get(u._id).password_hash), true);
      staff.push({ ...u, cookie: (await login(u.email)).cookie });
    }
    assert.equal((await request("/users/list")).body.length, 3);
    assert.equal((await request("/users/list")).body.some((u) => u.password_hash), false);
  });
  await t.test("matriz de permisos backend cubre lectura, escritura, PDF y envío", async () => {
    const rutasUsuarios = [["/users/list", "GET"], [`/users/info/${staff[0]._id}`, "GET"], ["/users", "POST"],
      [`/users/${staff[0]._id}`, "PUT"], [`/users/${staff[0]._id}/status`, "PATCH"], [`/users/${staff[0]._id}`, "DELETE"]];
    for (const u of staff) {
      for (const [path, method] of rutasUsuarios) {
        const res = await request(path, method, method === "GET" ? undefined : { activo: true, user: { rol: "Admin" } }, u.cookie);
        assert.equal(res.status, 403); assert.equal(res.body.code, "FORBIDDEN");
      }
      const personal = await request("/personal", "GET", undefined, u.cookie);
      assert.equal(personal.status, 200); assert.ok(personal.body.every((p) => p.email === undefined && p.password_hash === undefined && p.cedula === undefined));
    }
    for (const { path, method } of privadas.filter((r) => r.path.includes("/comprobantes"))) {
      const ruta = path.replace(/^\/v1/, "").replace(/:id/g, admin._id);
      assert.equal((await request(ruta, method, method === "GET" ? undefined : {}, staff[1].cookie)).status, 403);
      for (const cookie of [cookieAdmin, staff[0].cookie]) assert.equal((await request(ruta, method, method === "GET" ? undefined : {}, cookie)).status, 200);
    }
    for (const cookie of [cookieAdmin, ...staff.map((u) => u.cookie)]) assert.equal((await request("/insumos", "GET", undefined, cookie)).status, 200);
  });
  await t.test("no permite segundo Admin, promoción, autodesactivación, eliminación ni democión del Admin", async () => {
    assert.equal((await request("/users", "POST", crear(0))).status, 409);
    assert.equal((await request(`/users/${staff[0]._id}`, "PUT", { rol_id: roles[0]._id })).status, 409);
    for (const id of [admin._id, admin._id.toUpperCase()]) {
      assert.equal((await request(`/users/${id}/status`, "PATCH", { activo: false })).status, 403);
      assert.equal((await request(`/users/${id}`, "PUT", { activo: false })).status, 403);
    }
    assert.equal((await request(`/users/${admin._id}`, "PUT", { rol_id: roles[1]._id })).status, 409);
    assert.equal((await request(`/users/${admin._id}`, "DELETE")).status, 409);
    assert.equal(admin.activo, true); assert.equal(admin.rol_id, roles[0]._id);
  });
  await t.test("edita datos, rechaza duplicados y valida solicitudes malformadas", async () => {
    const hash = usuarios.get(staff[0]._id).password_hash;
    const editado = await request(`/users/${staff[0]._id}`, "PUT", { nombre: "Nombre editado", telefono: "77777777", password_hash: "manipulado", session_version: 99 });
    assert.equal(editado.status, 200); assert.equal(editado.body.usuario.nombre, "Nombre editado"); assert.equal(usuarios.get(staff[0]._id).password_hash, hash);
    for (const data of [{ email: staff[0].email }, { cedula: staff[0].cedula }]) assert.equal((await request("/users", "POST", crear(2, data))).status, 409);
    for (const data of [{ nombre: " " }, { email: "incorrecto" }, { password: "corta" }, { password: "á".repeat(40) }, { activo: "false" }, { rol_id: String(new mongoose.Types.ObjectId()) }]) {
      assert.equal((await request("/users", "POST", crear(2, data))).status, 400);
    }
    assert.equal((await request(`/users/${staff[0]._id}`, "PUT", { email: staff[1].email })).status, 409);
    assert.equal((await request(`/users/${staff[0]._id}`, "PUT", { cedula: staff[1].cedula })).status, 409);
    assert.equal((await request(`/users/${staff[0]._id}/status`, "PATCH", {})).status, 400);
    assert.equal((await request("/users", "POST")).status, 400);
    assert.equal((await request("/users/info/invalid")).status, 400);
    assert.equal((await request(`/users/info/${new mongoose.Types.ObjectId()}`)).status, 404);
  });
  await t.test("desactivación revoca todas las sesiones y reactivar nunca revive cookies/JWT antiguos", async () => {
    const u = staff[0], segundaCookie = (await login(u.email)).cookie;
    assert.equal((await request("/auth/me", "GET", undefined, segundaCookie)).status, 200);
    assert.equal((await request(`/users/${u._id}/status`, "PATCH", { activo: false })).status, 200);
    for (const cookie of [u.cookie, segundaCookie]) {
      assert.equal((await request("/auth/me", "GET", undefined, cookie)).body.code, "SESSION_INVALID");
      assert.equal((await request("/insumos", "GET", undefined, null, tokenCookie(cookie))).status, 401);
    }
    assert.equal((await login(u.email)).status, 403);
    assert.equal((await request(`/users/${u._id}/status`, "PATCH", { activo: true }, staff[1].cookie)).status, 403);
    assert.equal((await request(`/users/${u._id}`, "PUT", { activo: true }, staff[1].cookie)).status, 403);
    assert.equal((await request(`/users/${u._id}/status`, "PATCH", { activo: true }, null)).status, 401);
    assert.equal((await request(`/users/${u._id}/status`, "PATCH", { activo: true })).status, 200);
    for (const cookie of [u.cookie, segundaCookie]) assert.equal((await request("/auth/me", "GET", undefined, cookie)).status, 401);
    u.cookie = (await login(u.email)).cookie; assert.equal((await request("/auth/me", "GET", undefined, u.cookie)).status, 200);
  });
  await t.test("logout invalida token conservado, es idempotente y libera la sesión administrativa", async () => {
    const old = cookieAdmin;
    assert.equal((await login()).status, 409);
    assert.equal((await request("/auth/logout", "POST", undefined, old)).status, 200);
    assert.equal((await request("/auth/me", "GET", undefined, old)).status, 401);
    assert.equal((await request("/insumos", "GET", undefined, null, tokenCookie(old))).status, 401);
    cookieAdmin = (await login()).cookie; assert.ok(cookieAdmin);
    assert.equal((await request("/auth/logout", "POST", undefined, old)).status, 200);
    assert.equal((await request("/auth/me")).status, 200, "old logout cannot revoke a new session");
  });
  await t.test("dos logins administrativos simultáneos: solo uno obtiene sesión", async () => {
    await request("/auth/logout", "POST");
    const resultados = await Promise.all([login(), login()]); assert.deepEqual(resultados.map((r) => r.status).sort(), [200, 409]);
    cookieAdmin = resultados.find((r) => r.status === 200).cookie;
    assert.match(resultados.find((r) => r.status === 409).body.message, /sesión administrativa activa/);
  });
  await t.test("expiración en servidor libera Admin sin depender de la limpieza TTL", async () => {
    const old = cookieAdmin; sesiones.get(`admin:${admin._id}`).expires_at = new Date(Date.now() - 1000);
    assert.equal((await request("/auth/me", "GET", undefined, old)).status, 401);
    cookieAdmin = (await login()).cookie; assert.ok(cookieAdmin);
    assert.equal((await request("/auth/me", "GET", undefined, old)).status, 401);
    assert.equal((await request("/auth/me")).status, 200);
  });
  await t.test("una versión administrativa revocada no reserva el acceso ni sustituye una sesión nueva", async () => {
    const old = cookieAdmin, versionAnterior = admin.session_version;
    admin.session_version += 1; // Simula revocación por contraseña sin barrido de sesiones.
    assert.equal((await request("/auth/me", "GET", undefined, old)).status, 401);
    const nuevo = await login(); assert.equal(nuevo.status, 200); cookieAdmin = nuevo.cookie;
    await assert.rejects(() => crearSesion({ ...admin, session_version: versionAnterior, rol_id: roles[0] }),
      (error) => error.statusCode === 409);
    assert.equal((await request("/auth/me")).status, 200);
  });
  await t.test("fallo después de reservar Admin revoca la reserva y permite otro login", async () => {
    await request("/auth/logout", "POST");
    const update = Usuario.updateOne; Usuario.updateOne = async () => { throw new Error("Transient update failure"); };
    const fallido = await login(); assert.equal(fallido.status, 500); assert.equal(fallido.cookie, undefined);
    Usuario.updateOne = update;
    assert.ok(sesiones.get(`admin:${admin._id}`).revoked_at);
    const nuevo = await login(); assert.equal(nuevo.status, 200); cookieAdmin = nuevo.cookie;
  });
  await t.test("JWT legacy/expirado/falsificado rechazado; rol del JWT nunca concede permisos", async () => {
    const u = staff[0]; const actual = jwt.decode(tokenCookie(u.cookie));
    const legacy = jwt.sign({ userId: u._id, rol: "Admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
    const expirado = jwt.sign({ userId: u._id, sid: actual.sid, version: actual.version }, process.env.JWT_SECRET, { expiresIn: -1 });
    const falso = jwt.sign({ userId: admin._id, sid: actual.sid, version: actual.version }, "otro-secreto");
    for (const token of [legacy, expirado, falso]) assert.equal((await request("/auth/me", "GET", undefined, null, token)).status, 401);
    const rolManipulado = jwt.sign({ userId: u._id, sid: actual.sid, version: actual.version, rol: "Admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
    assert.equal((await request("/users/list", "GET", undefined, null, rolManipulado)).status, 403);
  });
  await t.test("cambio de rol revoca sesiones y los permisos nuevos requieren otro login", async () => {
    const u = staff[0], old = u.cookie;
    assert.equal((await request(`/users/${u._id}`, "PUT", { rol_id: roles[2]._id })).status, 200);
    assert.equal((await request("/auth/me", "GET", undefined, old)).status, 401);
    u.cookie = (await login(u.email)).cookie;
    assert.equal((await request("/comprobantes", "GET", undefined, u.cookie)).status, 403);
  });
  await t.test("restablecer contraseña consume enlace una vez y revoca sesiones previas", async () => {
    const u = staff[1], old = u.cookie, raw = usuarios.get(u._id), token = crypto.randomBytes(32).toString("hex");
    raw.reset_password_token_hash = crypto.createHash("sha256").update(token).digest("hex");
    raw.reset_password_expires_at = new Date(Date.now() + 60000);
    assert.equal((await request("/auth/restablecer-password", "POST", { token, password: "Nueva123!" }, null)).status, 200);
    assert.equal((await request("/auth/me", "GET", undefined, old)).status, 401);
    assert.equal((await request("/auth/restablecer-password", "POST", { token, password: "Otra123!" }, null)).status, 400);
    assert.equal((await login(u.email)).status, 401);
    const nuevo = await request("/auth/login", "POST", { email: u.email, password: "Nueva123!" }, null);
    assert.equal(nuevo.status, 200); u.cookie = nuevo.cookie;
  });
  await t.test("versión revocada falla incluso si no se pudo actualizar la colección sesiones", async () => {
    const u = staff[1], old = u.cookie, updateMany = Sesion.updateMany;
    Sesion.updateMany = async () => { throw new Error("Session storage failure"); };
    assert.equal((await request(`/users/${u._id}/status`, "PATCH", { activo: false })).status, 500);
    Sesion.updateMany = updateMany;
    assert.equal((await request(`/users/${u._id}/status`, "PATCH", { activo: true })).status, 200);
    assert.equal((await request("/auth/me", "GET", undefined, old)).status, 401);
  });
  await t.test("error de persistencia detiene acceso y no ejecuta controlador", async () => {
    const find = Sesion.findOne; Sesion.findOne = async () => { throw new Error("DB unavailable"); };
    const res = await request("/insumos"); assert.equal(res.status, 503); assert.equal(res.body.code, "AUTH_UNAVAILABLE");
    Sesion.findOne = find;
  });
  await t.test("eliminación conserva historial y cuentas eliminadas no conservan acceso", async () => {
    historial.add(staff[0]._id);
    assert.equal((await request(`/users/${staff[0]._id}`, "DELETE")).status, 409);
    assert.equal((await request(`/users/${staff[1]._id}`, "DELETE")).status, 200);
    assert.equal((await request(`/users/info/${staff[1]._id}`)).status, 404);
    assert.equal((await request("/auth/me", "GET", undefined, staff[1].cookie)).status, 401);
  });
});
