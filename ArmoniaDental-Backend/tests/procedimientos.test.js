import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import ProcedimientoModel from "../src/models/ProcedimientoModel.js";
import PacienteModel from "../src/models/PacienteModel.js";
import {
  listarProcedimientosService,
  crearProcedimientoService,
  actualizarProcedimientoService,
  anularProcedimientoService,
  registrarAbonoService,
  anularAbonoService,
} from "../src/services/ProcedimientoService.js";

const nuevoId = () => new mongoose.Types.ObjectId().toString(); // texto, como llegan en la URL
const PACIENTE = nuevoId();
const DRA = { _id: nuevoId(), nombre: "Dra. Laura Ureña" };
const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
const ayer = new Date(Date.now() - 86400000).toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
const manana = new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
const consulta = (v) => ({ select: () => consulta(v), sort: () => consulta(v), lean: async () => structuredClone(v) });

// Base de datos en memoria que entiende las operaciones que usa el servicio
const montarBD = (t) => {
  const docs = new Map();
  const coincide = (d, f) => Object.entries(f).every(([k, v]) => {
    if (k === "_id") return String(d._id) === String(v);
    if (k === "anulado") return v.$ne === true ? d.anulado !== true : d.anulado === v;
    if (k === "__v") return d.__v === v;
    if (k === "abonos") return d.abonos.some((a) => String(a._id) === String(v.$elemMatch._id) && a.anulado !== true);
    if (k === "paciente_id") return String(d.paciente_id) === String(v);
    return true;
  });
  t.mock.method(PacienteModel, "findById", (id) => consulta(String(id) === PACIENTE ? { _id: id } : null));
  t.mock.method(ProcedimientoModel, "create", async (d) => {
    const doc = { _id: nuevoId(), __v: 0, anulado: false, createdAt: new Date(), ...structuredClone(d),
      abonos: d.abonos.map((a) => ({ _id: nuevoId(), anulado: false, ...a })) };
    docs.set(String(doc._id), doc);
    return { toObject: () => structuredClone(doc) };
  });
  t.mock.method(ProcedimientoModel, "findById", (id) => consulta(docs.get(String(id)) ?? null));
  t.mock.method(ProcedimientoModel, "find", (f) => consulta([...docs.values()].filter((d) => coincide(d, f))));
  t.mock.method(ProcedimientoModel, "exists", async (f) => [...docs.values()].some((d) => coincide(d, f)));
  t.mock.method(ProcedimientoModel, "findOneAndUpdate", (f, u) => {
    const d = [...docs.values()].find((x) => coincide(x, f));
    if (d) {
      for (const [k, v] of Object.entries(u.$set || {})) {
        if (k.startsWith("abonos.$.")) d.abonos.find((a) => String(a._id) === String(f.abonos.$elemMatch._id))[k.slice(9)] = v;
        else d[k] = v;
      }
      for (const a of [].concat(u.$push?.abonos ?? [])) d.abonos.push({ _id: nuevoId(), anulado: false, ...a });
      if (u.$inc?.__v) d.__v += u.$inc.__v;
    }
    return consulta(d ?? null);
  });
  return docs;
};

const rechaza = (promesa, patron, status) =>
  assert.rejects(promesa, (e) => patron.test(e.message) && (status === undefined || e.status === status));

test("crear: calcula abonado, saldo y estado; con abono inicial", async (t) => {
  montarBD(t);
  const p = await crearProcedimientoService(PACIENTE, { fecha: hoy, procedimiento: "Endodoncia pieza 16", pieza: "16",
    monto: "85000", abono_inicial: 30000, metodo_pago: "SINPE Móvil" }, DRA);
  assert.equal(p.monto, 85000);
  assert.equal(p.abonado, 30000);
  assert.equal(p.saldo, 55000);
  assert.equal(p.estado, "Con abonos");
  assert.equal(p.abonos[0].metodo, "SINPE Móvil");
  assert.equal(p.creado_por.nombre, "Dra. Laura Ureña");
  const sinAbono = await crearProcedimientoService(PACIENTE, { fecha: hoy, procedimiento: "Limpieza", monto: 25000 }, DRA);
  assert.equal(sinAbono.estado, "Pendiente");
  assert.equal(sinAbono.saldo, 25000);
});

test("crear: validaciones de datos y de dinero", async (t) => {
  montarBD(t);
  const base = { fecha: hoy, procedimiento: "Resina", monto: 20000 };
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, procedimiento: "  " }, DRA), /obligatorio/);
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, monto: 0 }, DRA), /mayor a cero/);
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, monto: -500 }, DRA), /mayor a cero/);
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, monto: "abc" }, DRA), /número/);
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, monto: 10.555 }, DRA), /2 decimales/);
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, monto: 500000000 }, DRA), /demasiado alto/);
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, fecha: manana }, DRA), /futura/);
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, fecha: "2026-02-30" }, DRA), /no es válida/);
  await rechaza(crearProcedimientoService(PACIENTE, { ...base, abono_inicial: 25000 }, DRA), /mayor que el monto/);
  await rechaza(crearProcedimientoService(new mongoose.Types.ObjectId().toString(), base, DRA), /paciente no existe/, 404);
});

test("abonos: el saldo baja con cada abono, no se puede pagar de más y queda Pagado", async (t) => {
  montarBD(t);
  const p = await crearProcedimientoService(PACIENTE, { fecha: ayer, procedimiento: "Corona", monto: "150000.50" }, DRA);
  let r = await registrarAbonoService(p._id, { fecha: ayer, monto: 50000, metodo: "Efectivo" }, DRA);
  assert.equal(r.saldo, 100000.5);
  await rechaza(registrarAbonoService(p._id, { fecha: hoy, monto: 100000.51 }, DRA), /mayor al saldo/);
  await rechaza(registrarAbonoService(p._id, { fecha: hoy, monto: 100, metodo: "Bitcoin" }, DRA), /método de pago/);
  r = await registrarAbonoService(p._id, { fecha: hoy, monto: 100000.5, metodo: "Tarjeta", nota: "Cancela" }, DRA);
  assert.equal(r.saldo, 0);
  assert.equal(r.estado, "Pagado");
  assert.equal(r.abonos.length, 2);
  await rechaza(registrarAbonoService(p._id, { fecha: hoy, monto: 1 }, DRA), /pagado por completo/, 409);
});

test("decimales: los céntimos no acumulan errores", async (t) => {
  montarBD(t);
  const p = await crearProcedimientoService(PACIENTE, { fecha: hoy, procedimiento: "Prueba", monto: 0.3 }, DRA);
  await registrarAbonoService(p._id, { fecha: hoy, monto: 0.1 }, DRA);
  const r = await registrarAbonoService(p._id, { fecha: hoy, monto: 0.2 }, DRA);
  assert.equal(r.saldo, 0);
  assert.equal(r.estado, "Pagado");
});

test("anular un abono devuelve ese monto al saldo y conserva el registro", async (t) => {
  montarBD(t);
  const p = await crearProcedimientoService(PACIENTE, { fecha: hoy, procedimiento: "Ortodoncia", monto: 60000, abono_inicial: 60000 }, DRA);
  assert.equal(p.estado, "Pagado");
  await rechaza(anularAbonoService(p._id, p.abonos[0]._id, " ", DRA), /motivo/);
  const r = await anularAbonoService(p._id, p.abonos[0]._id, "Se registró al paciente equivocado", DRA);
  assert.equal(r.saldo, 60000);
  assert.equal(r.estado, "Pendiente");
  assert.equal(r.abonos.length, 1);
  assert.equal(r.abonos[0].anulado, true);
  assert.equal(r.abonos[0].anulado_por.nombre, "Dra. Laura Ureña");
  await rechaza(anularAbonoService(p._id, p.abonos[0]._id, "Otra vez", DRA), /ya estaba anulado/, 409);
});

test("editar: no permite bajar el monto por debajo de lo abonado", async (t) => {
  montarBD(t);
  const p = await crearProcedimientoService(PACIENTE, { fecha: hoy, procedimiento: "Puente 14-16", monto: 300000, abono_inicial: 120000 }, DRA);
  await rechaza(actualizarProcedimientoService(p._id, { monto: 100000 }, DRA), /menor a lo ya abonado/);
  const r = await actualizarProcedimientoService(p._id, { monto: 280000, procedimiento: "Puente 14 a 16" }, DRA);
  assert.equal(r.saldo, 160000);
  assert.equal(r.procedimiento, "Puente 14 a 16");
  assert.equal(r.actualizado_por.nombre, "Dra. Laura Ureña");
});

test("anular un procedimiento: sale de los totales y ya no admite cambios", async (t) => {
  montarBD(t);
  const p1 = await crearProcedimientoService(PACIENTE, { fecha: ayer, procedimiento: "Extracción", monto: 40000, abono_inicial: 10000 }, DRA);
  await crearProcedimientoService(PACIENTE, { fecha: hoy, procedimiento: "Limpieza", monto: 25000 }, DRA);
  await rechaza(anularProcedimientoService(p1._id, "", DRA), /motivo/);
  const anulado = await anularProcedimientoService(p1._id, "El paciente decidió no realizarlo", DRA);
  assert.equal(anulado.estado, "Anulado");
  await rechaza(registrarAbonoService(p1._id, { fecha: hoy, monto: 100 }, DRA), /anulado/, 409);
  await rechaza(actualizarProcedimientoService(p1._id, { monto: 1 }, DRA), /anulado/, 409);
  await rechaza(anularProcedimientoService(p1._id, "otra vez", DRA), /ya estaba anulado/, 409);

  const { procedimientos, resumen } = await listarProcedimientosService(PACIENTE);
  assert.equal(procedimientos.length, 2); // el anulado se sigue mostrando
  assert.deepEqual(resumen, { total: 25000, abonado: 0, saldo: 25000, cantidad: 1, conSaldo: 1 });
});

test("dos abonos al mismo tiempo no pueden superar el saldo", async (t) => {
  const docs = montarBD(t);
  const p = await crearProcedimientoService(PACIENTE, { fecha: hoy, procedimiento: "Blanqueamiento", monto: 50000 }, DRA);
  // Simula que otra persona registra 40 000 justo después de que este proceso leyó el saldo
  const original = ProcedimientoModel.findById;
  let primera = true;
  t.mock.method(ProcedimientoModel, "findById", (id) => {
    const q = original(id);
    if (primera) {
      primera = false;
      const d = docs.get(String(id));
      d.abonos.push({ _id: nuevoId(), fecha: hoy, monto: 40000, anulado: false });
      d.__v += 1;
      return { lean: async () => ({ ...(await q.lean()), __v: d.__v - 1, abonos: [] }) };
    }
    return q;
  });
  await rechaza(registrarAbonoService(p._id, { fecha: hoy, monto: 30000 }, DRA), /mayor al saldo pendiente \(₡10\s?000,00\)/);
});

test("rutas: solo Admin y Dentista", async () => {
  const fuente = await import("node:fs").then((fs) => fs.readFileSync(new URL("../src/routes/ProcedimientosRoutes.js", import.meta.url), "utf8"));
  assert.match(fuente, /autorizarRoles\("Admin", "Dentista"\)/);
  assert.equal((fuente.match(/verifyToken, autorizar,/g) || []).length, 6);
});
