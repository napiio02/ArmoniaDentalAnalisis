import { createServer as createHttpServer } from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import renderer, { act } from "react-test-renderer";
import { createServer } from "vite";
import { puedeAcceder, ultimaRutaPermitida } from "../src/auth/permisos.js";

const storage = () => {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key), clear: () => map.clear() };
};
test("matriz de rutas y última ruta por usuario", () => {
  const comunes = ["/", "/citas", "/pacientes", "/inventario", "/control-marcas", "/reportes", "/odontograma", "/expedientes"];
  for (const rol of ["Admin", "Dentista", "Asistente Dental"]) {
    const usuario = { _id: "1", rol };
    assert.ok(comunes.every((ruta) => puedeAcceder(usuario, ruta)));
    for (const ruta of ["/administracion/usuarios", "/administracion/usuarios/", "/usuarios", "/administracion"]) {
      assert.equal(puedeAcceder(usuario, ruta), rol === "Admin");
    }
    assert.equal(puedeAcceder(usuario, "/comprobantes?pagina=1"), rol !== "Asistente Dental");
  }
  assert.equal(puedeAcceder({ rol: "Desconocido" }, "/"), false);
  const almacen = storage(), usuario = { _id: "1", rol: { nombre: "Dentista" } };
  for (const ruta of ["//externo", "/login", "/administracion/usuarios"]) {
    almacen.setItem("ultimaRutaPermitida", JSON.stringify({ usuarioId: "1", ruta }));
    assert.equal(ultimaRutaPermitida(usuario, almacen), "/");
  }
  almacen.setItem("ultimaRutaPermitida", JSON.stringify({ usuarioId: "otro", ruta: "/pacientes" }));
  assert.equal(ultimaRutaPermitida(usuario, almacen), "/");
  almacen.setItem("ultimaRutaPermitida", JSON.stringify({ usuarioId: "1", ruta: "/pacientes?pagina=2" }));
  assert.equal(ultimaRutaPermitida(usuario, almacen), "/pacientes?pagina=2");
});

test("rutas, Sidebar y sesiones con componentes reales de React", async (t) => {
  // No browser or real accounts needed. Only HTTP and browser environment objects
  // are substituted; effects, navigation, guards and Sidebar are real.
  const keys = ["window", "document", "localStorage", "sessionStorage", "fetch", "setInterval", "clearInterval"];
  const originales = Object.fromEntries(keys.map((key) => [key, globalThis[key]]));
  globalThis.window = Object.assign(new EventTarget(), { location: { href: "http://localhost:5173/citas", origin: "http://localhost:5173" } });
  globalThis.document = Object.assign(new EventTarget(), { visibilityState: "visible" });
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
  const polls = new Map(); let pollId = 0;
  globalThis.setInterval = (cb, ms, ...args) => {
    if (ms !== 10000) return originales.setInterval(cb, ms, ...args);
    const id = `poll:${++pollId}`; polls.set(id, cb); return id;
  };
  globalThis.clearInterval = (id) => { if (polls.has(id)) polls.delete(id); else originales.clearInterval(id); };
  let rol = "Dentista", vigente = true, disponible = true, consultas = 0, resolverConsulta;
  const usuario = () => ({ _id: "usuario-prueba", nombre: "Prueba", rol, activo: true });
  globalThis.fetch = async (url) => {
    assert.ok(url.includes("/auth/me"), `Unexpected endpoint: ${url}`); consultas += 1;
    if (resolverConsulta) await new Promise((resolve) => { resolverConsulta.resolve = resolve; });
    const code = !disponible ? "AUTH_UNAVAILABLE" : !vigente ? "SESSION_INVALID" : null;
    return new Response(JSON.stringify(code ? { code, message: code } : { data: { usuario: usuario() } }),
      { status: !disponible ? 503 : !vigente ? 401 : 200, headers: { "Content-Type": "application/json" } });
  };
  const vite = await createServer({ server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }, appType: "custom", logLevel: "error" });
  let tree;
  const montar = async (ruta = "/citas") => { await act(async () => { tree = renderer.create(React.createElement(Harness, { ruta })); }); };
  const desmontar = async () => { if (tree) await act(async () => tree.unmount()); tree = null; };
  const rutaActual = () => tree.root.findByProps({ id: "ruta-actual" }).children.join("");
  const pantalla = () => tree.root.findAllByProps({ id: "pantalla" }).map((n) => n.children.join(""));
  const popup = () => tree.root.findAllByProps({ role: "alertdialog" }).map((n) => JSON.stringify(n.toJSON?.() || n.findByType("p").children));
  const abrirAdmin = async () => {
    const boton = tree.root.findAllByType("button").find((n) => n.findAllByType("span").some((span) => span.children.includes("Administración")));
    await act(async () => boton.props.onClick());
  };
  const links = () => tree.root.findAllByType("a").map((n) => n.props.href);
  t.after(async () => { await desmontar(); await vite.close(); for (const key of keys) {
    if (originales[key] === undefined) delete globalThis[key]; else globalThis[key] = originales[key];
  } });
  const { Harness, control } = await vite.ssrLoadModule("/tests/authHarness.jsx");
  await t.test("Dentista: Sidebar y URL directa denegada vuelven a la última pantalla", async () => {
    await montar(); assert.deepEqual(pantalla(), ["/citas"]); await abrirAdmin();
    assert.equal(links().includes("/administracion/usuarios"), false); assert.equal(links().includes("/comprobantes"), true);
    const antes = consultas;
    await act(async () => control.navigate("/administracion/usuarios"));
    assert.equal(rutaActual(), "/citas"); assert.deepEqual(pantalla(), ["/citas"]); assert.ok(consultas > antes);
    assert.match(popup().join(""), /Acceso denegado/);
    await desmontar();
  });
  await t.test("Asistente: ambas opciones ocultas; recarga en URL prohibida conserva última ruta", async () => {
    rol = "Asistente Dental"; await montar("/comprobantes");
    assert.equal(rutaActual(), "/citas"); assert.deepEqual(pantalla(), ["/citas"]);
    await abrirAdmin(); assert.equal(links().includes("/comprobantes"), false); assert.equal(links().includes("/administracion/usuarios"), false);
    await act(async () => control.navigate("/administracion/usuarios")); assert.equal(rutaActual(), "/citas");
    await desmontar();
  });
  await t.test("Admin: opciones visibles y menú activo tras entrar directamente", async () => {
    rol = "Admin"; await montar("/administracion/usuarios");
    assert.deepEqual(pantalla(), ["/administracion/usuarios"]);
    assert.ok(links().includes("/administracion/usuarios")); assert.ok(links().includes("/comprobantes"));
    await act(async () => control.navigate("/comprobantes")); assert.deepEqual(pantalla(), ["/comprobantes"]);
    const comprobantes = tree.root.findAllByType("a").find((n) => n.props.href === "/comprobantes");
    assert.match(comprobantes.props.className, /border-l-4/);
    await desmontar();
  });
  await t.test("el usuario manipulado en localStorage no concede permisos y no se monta la pantalla mientras se valida", async () => {
    rol = "Dentista"; localStorage.setItem("usuario", JSON.stringify({ ...usuario(), rol: "Admin" }));
    sessionStorage.removeItem("ultimaRutaPermitida");
    resolverConsulta = {};
    await montar("/administracion/usuarios"); assert.deepEqual(pantalla(), []);
    const terminar = resolverConsulta.resolve; resolverConsulta = null;
    await act(async () => terminar());
    assert.equal(rutaActual(), "/"); assert.deepEqual(pantalla(), ["/"]);
    await desmontar();
  });
  await t.test("sesión revocada se detecta en el sondeo y expulsa sin interacción", async () => {
    await montar(); vigente = false;
    await act(async () => { for (const cb of [...polls.values()]) await cb(); });
    assert.equal(rutaActual(), "/login"); assert.deepEqual(pantalla(), ["Login"]);
    assert.equal(localStorage.getItem("usuario"), null); assert.equal(sessionStorage.getItem("ultimaRutaPermitida"), null);
    await desmontar(); vigente = true;
  });
  await t.test("volver a una pestaña oculta comprueba inmediatamente la sesión", async () => {
    await montar(); document.visibilityState = "hidden"; vigente = false;
    const antes = consultas;
    await act(async () => { for (const cb of [...polls.values()]) await cb(); });
    assert.equal(consultas, antes);
    document.visibilityState = "visible";
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    assert.equal(rutaActual(), "/login"); await desmontar(); vigente = true;
  });
  await t.test("si no se puede validar se bloquea la pantalla y el reintento recupera acceso", async () => {
    await montar(); disponible = false;
    await act(async () => { for (const cb of [...polls.values()]) await cb(); });
    assert.deepEqual(pantalla(), []); assert.equal(rutaActual(), "/citas");
    disponible = true;
    const retry = tree.root.findAllByType("button").find((n) => n.children.includes("Reintentar"));
    await act(async () => retry.props.onClick()); assert.deepEqual(pantalla(), ["/citas"]);
    await desmontar();
  });
  await t.test("si el rol vigente pierde acceso durante el sondeo se abandona la pantalla restringida", async () => {
    rol = "Dentista"; await montar("/comprobantes");
    rol = "Asistente Dental";
    await act(async () => { for (const cb of [...polls.values()]) await cb(); });
    assert.equal(rutaActual(), "/"); assert.deepEqual(pantalla(), ["/"]); assert.match(popup().join(""), /Acceso denegado/);
    await desmontar();
  });
  await t.test("Axios envía credenciales y una respuesta inválida expulsa al usuario", async () => {
    await montar();
    const { http, API_URL } = await vite.ssrLoadModule("/src/services/apiClient.js");
    const anterior = http.defaults.adapter;
    http.defaults.adapter = async (config) => ({ data: {}, status: 200, statusText: "OK", headers: {}, config });
    const res = await http.get("https://armoniadentalbackend.onrender.com/v1/insumos");
    assert.equal(res.config.withCredentials, true); assert.equal(res.config.url, API_URL + "/insumos");
    http.defaults.adapter = async (config) => { throw Object.assign(new Error("Sesión inválida"), {
      config, response: { status: 401, data: { code: "SESSION_INVALID" } },
    }); };
    await act(async () => { await assert.rejects(http.get(API_URL + "/insumos")); });
    assert.equal(rutaActual(), "/login"); http.defaults.adapter = anterior; await desmontar();
  });
  await t.test("una respuesta de API de sesión inválida y logout en otra pestaña expulsan", async () => {
    await montar();
    await act(async () => window.dispatchEvent(new CustomEvent("auth:respuesta", { detail: { code: "SESSION_INVALID" } })));
    assert.equal(rutaActual(), "/login"); await desmontar();
    await montar();
    const event = new Event("storage"); event.key = "auth:logout";
    await act(async () => window.dispatchEvent(event)); assert.equal(rutaActual(), "/login"); await desmontar();
  });
});
