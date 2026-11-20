import mongoose from "mongoose";
import ProcedimientoModel, { METODOS_PAGO } from "../models/ProcedimientoModel.js";
import PacienteModel from "../models/PacienteModel.js";
import { fechaCR, fechaValida } from "../utils/AgendaUtils.js";

/*
 * Los montos se manejan en céntimos (enteros) para que las sumas no acumulen
 * errores de decimales: 0.1 + 0.2 no da 0.30000000000000004 en un saldo.
 */
const MAX_MONTO = 100_000_000; // ₡100 millones: límite de seguridad ante errores de digitación
const aCentimos = (monto) => Math.round(Number(monto) * 100);
const deCentimos = (centimos) => centimos / 100;
const colones = (monto) =>
  new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", minimumFractionDigits: 2 }).format(monto);

const lanzar = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  throw error;
};

const usuarioRef = (usuario) => (usuario ? { _id: usuario._id, nombre: usuario.nombre || "" } : null);

const validarId = (id, nombre = "procedimiento") => {
  if (!mongoose.isValidObjectId(id)) lanzar(`El ${nombre} no existe.`, 404);
};

// Monto positivo, con máximo 2 decimales y dentro del límite
const validarMonto = (valor, campo) => {
  const numero = typeof valor === "string" ? Number(valor.replace(/[\s,₡]/g, "")) : Number(valor);
  if (valor === "" || valor === null || valor === undefined || !Number.isFinite(numero)) {
    lanzar(`${campo} debe ser un número.`);
  }
  if (numero <= 0) lanzar(`${campo} debe ser mayor a cero.`);
  if (numero > MAX_MONTO) lanzar(`${campo} es demasiado alto. Revise la cantidad.`);
  if (Math.abs(aCentimos(numero) - numero * 100) > 1e-6) lanzar(`${campo} admite como máximo 2 decimales.`);
  return deCentimos(aCentimos(numero));
};

// Fecha AAAA-MM-DD válida y no futura (hora de Costa Rica)
const validarFecha = (fecha, campo = "La fecha") => {
  if (!fechaValida(fecha)) lanzar(`${campo} no es válida.`);
  if (fecha > fechaCR(new Date())) lanzar(`${campo} no puede ser futura.`);
  return fecha;
};

const validarTexto = (valor, campo, { requerido = false, max }) => {
  const texto = String(valor ?? "").trim();
  if (requerido && !texto) lanzar(`${campo} es obligatorio.`);
  if (texto.length > max) lanzar(`${campo} admite como máximo ${max} caracteres.`);
  return texto;
};

const validarMotivo = (motivo) =>
  validarTexto(motivo, "El motivo de la anulación", { requerido: true, max: 300 });

/* ───────── Cálculos ───────── */

export const calcularEstado = (procedimiento) => {
  const abonosVigentes = (procedimiento.abonos || []).filter((a) => !a.anulado);
  const montoC = aCentimos(procedimiento.monto);
  const abonadoC = abonosVigentes.reduce((total, a) => total + aCentimos(a.monto), 0);
  const saldoC = Math.max(montoC - abonadoC, 0);

  let estado = "Pendiente";
  if (procedimiento.anulado) estado = "Anulado";
  else if (saldoC === 0) estado = "Pagado";
  else if (abonadoC > 0) estado = "Con abonos";

  return {
    ...procedimiento,
    abonos: [...(procedimiento.abonos || [])].sort((a, b) =>
      a.fecha === b.fecha
        ? new Date(a.registrado_en) - new Date(b.registrado_en)
        : a.fecha.localeCompare(b.fecha)
    ),
    abonado: deCentimos(abonadoC),
    saldo: deCentimos(saldoC),
    estado,
  };
};

export const resumirProcedimientos = (procedimientos) => {
  const vigentes = procedimientos.filter((p) => !p.anulado);
  const totalC = vigentes.reduce((t, p) => t + aCentimos(p.monto), 0);
  const abonadoC = vigentes.reduce((t, p) => t + aCentimos(p.abonado), 0);
  return {
    total: deCentimos(totalC),
    abonado: deCentimos(abonadoC),
    saldo: deCentimos(totalC - abonadoC),
    cantidad: vigentes.length,
    conSaldo: vigentes.filter((p) => p.saldo > 0).length,
  };
};

/* ───────── Consultas ───────── */

const obtenerVigente = async (id) => {
  validarId(id);
  const procedimiento = await ProcedimientoModel.findById(id).lean();
  if (!procedimiento) lanzar("El procedimiento no existe.", 404);
  if (procedimiento.anulado) lanzar("El procedimiento está anulado y no se puede modificar.", 409);
  return procedimiento;
};

export const listarProcedimientosService = async (pacienteId) => {
  validarId(pacienteId, "paciente");
  const paciente = await PacienteModel.findById(pacienteId).select("_id").lean();
  if (!paciente) lanzar("El paciente no existe.", 404);

  const lista = await ProcedimientoModel.find({ paciente_id: pacienteId })
    .sort({ fecha: -1, createdAt: -1 })
    .lean();
  const procedimientos = lista.map(calcularEstado);

  return { procedimientos, resumen: resumirProcedimientos(procedimientos) };
};

/* ───────── Procedimientos ───────── */

export const crearProcedimientoService = async (pacienteId, datos = {}, usuario) => {
  validarId(pacienteId, "paciente");
  const paciente = await PacienteModel.findById(pacienteId).select("_id").lean();
  if (!paciente) lanzar("El paciente no existe.", 404);

  const fecha = validarFecha(datos.fecha);
  const monto = validarMonto(datos.monto, "El monto del procedimiento");
  const nuevo = {
    paciente_id: pacienteId,
    fecha,
    procedimiento: validarTexto(datos.procedimiento, "El procedimiento", { requerido: true, max: 200 }),
    pieza: validarTexto(datos.pieza, "La pieza", { max: 60 }),
    notas: validarTexto(datos.notas, "Las notas", { max: 500 }),
    monto,
    abonos: [],
    creado_por: usuarioRef(usuario),
  };

  // Abono inicial opcional (el paciente paga una parte al registrar el procedimiento)
  if (datos.abono_inicial !== undefined && datos.abono_inicial !== null && datos.abono_inicial !== "") {
    const abono = validarAbono({ fecha, metodo: datos.metodo_pago, monto: datos.abono_inicial }, usuario);
    if (aCentimos(abono.monto) > aCentimos(monto)) lanzar("El abono no puede ser mayor que el monto del procedimiento.");
    nuevo.abonos.push(abono);
  }

  const creado = await ProcedimientoModel.create(nuevo);
  return calcularEstado(creado.toObject());
};

export const actualizarProcedimientoService = async (id, datos = {}, usuario) => {
  const actual = calcularEstado(await obtenerVigente(id));
  const cambios = {};

  if (datos.fecha !== undefined) cambios.fecha = validarFecha(datos.fecha);
  if (datos.procedimiento !== undefined) {
    cambios.procedimiento = validarTexto(datos.procedimiento, "El procedimiento", { requerido: true, max: 200 });
  }
  if (datos.pieza !== undefined) cambios.pieza = validarTexto(datos.pieza, "La pieza", { max: 60 });
  if (datos.notas !== undefined) cambios.notas = validarTexto(datos.notas, "Las notas", { max: 500 });
  if (datos.monto !== undefined) {
    cambios.monto = validarMonto(datos.monto, "El monto del procedimiento");
    if (aCentimos(cambios.monto) < aCentimos(actual.abonado)) {
      lanzar(`El monto no puede ser menor a lo ya abonado (${colones(actual.abonado)}).`);
    }
  }
  if (Object.keys(cambios).length === 0) return actual;

  cambios.actualizado_por = usuarioRef(usuario);
  // Condición de versión: si alguien registró un abono mientras tanto, no se pisa
  const actualizado = await ProcedimientoModel.findOneAndUpdate(
    { _id: id, anulado: { $ne: true }, __v: actual.__v },
    { $set: cambios, $inc: { __v: 1 } },
    { new: true, runValidators: true }
  ).lean();
  if (!actualizado) lanzar("El procedimiento cambió mientras lo editaba. Recargue e intente de nuevo.", 409);
  return calcularEstado(actualizado);
};

export const anularProcedimientoService = async (id, motivo, usuario) => {
  validarId(id);
  const motivoLimpio = validarMotivo(motivo);
  const anulado = await ProcedimientoModel.findOneAndUpdate(
    { _id: id, anulado: { $ne: true } },
    {
      $set: { anulado: true, motivo_anulacion: motivoLimpio, anulado_por: usuarioRef(usuario), anulado_en: new Date() },
      $inc: { __v: 1 },
    },
    { new: true }
  ).lean();
  if (!anulado) {
    const existe = await ProcedimientoModel.exists({ _id: id });
    lanzar(existe ? "El procedimiento ya estaba anulado." : "El procedimiento no existe.", existe ? 409 : 404);
  }
  return calcularEstado(anulado);
};

/* ───────── Abonos ───────── */

const validarAbono = (datos, usuario) => {
  const metodo = datos.metodo || "Efectivo";
  if (!METODOS_PAGO.includes(metodo)) lanzar("El método de pago no es válido.");
  return {
    fecha: validarFecha(datos.fecha, "La fecha del abono"),
    monto: validarMonto(datos.monto, "El abono"),
    metodo,
    nota: validarTexto(datos.nota, "La nota", { max: 300 }),
    registrado_por: usuarioRef(usuario),
    registrado_en: new Date(),
  };
};

export const registrarAbonoService = async (id, datos = {}, usuario) => {
  const abono = validarAbono(datos, usuario);

  // Reintenta si otra persona registró un abono al mismo tiempo, para no superar el saldo
  for (let intento = 0; intento < 3; intento++) {
    const actual = calcularEstado(await obtenerVigente(id));
    if (actual.saldo <= 0) lanzar("Este procedimiento ya está pagado por completo.", 409);
    if (aCentimos(abono.monto) > aCentimos(actual.saldo)) {
      lanzar(`El abono no puede ser mayor al saldo pendiente (${colones(actual.saldo)}).`);
    }

    const actualizado = await ProcedimientoModel.findOneAndUpdate(
      { _id: id, anulado: { $ne: true }, __v: actual.__v },
      { $push: { abonos: abono }, $inc: { __v: 1 } },
      { new: true, runValidators: true }
    ).lean();
    if (actualizado) return calcularEstado(actualizado);
  }
  lanzar("No se pudo registrar el abono porque el procedimiento cambió. Intente de nuevo.", 409);
};

export const anularAbonoService = async (id, abonoId, motivo, usuario) => {
  validarId(abonoId, "abono");
  const motivoLimpio = validarMotivo(motivo);
  const actual = await obtenerVigente(id);
  const abono = actual.abonos.find((a) => String(a._id) === String(abonoId));
  if (!abono) lanzar("El abono no existe.", 404);
  if (abono.anulado) lanzar("El abono ya estaba anulado.", 409);

  const actualizado = await ProcedimientoModel.findOneAndUpdate(
    { _id: id, anulado: { $ne: true }, abonos: { $elemMatch: { _id: abonoId, anulado: { $ne: true } } } },
    {
      $set: {
        "abonos.$.anulado": true,
        "abonos.$.motivo_anulacion": motivoLimpio,
        "abonos.$.anulado_por": usuarioRef(usuario),
        "abonos.$.anulado_en": new Date(),
      },
      $inc: { __v: 1 },
    },
    { new: true }
  ).lean();
  if (!actualizado) lanzar("El abono ya estaba anulado.", 409);
  return calcularEstado(actualizado);
};
