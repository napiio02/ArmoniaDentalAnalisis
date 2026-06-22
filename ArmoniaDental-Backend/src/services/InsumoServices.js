import Insumo from "../models/InsumoModel.js";
import MovimientoInsumo from "../models/MovimientoInsumoModel.js";

const generarCodigo = async () => {
  const ultimoInsumo = await Insumo.findOne({
    codigo: new RegExp(`^INS-`),
  })
    .sort({ codigo: -1 })
    .limit(1);

  let numero = 1;
  if (ultimoInsumo) {
    const match = ultimoInsumo.codigo.match(/\d+$/);
    if (match) numero = parseInt(match[0]) + 1;
  }

  return `INS-${String(numero).padStart(3, "0")}`;
};

export const getInsumos = async () => {
  return await Insumo.find();
};

export const getInsumoById = async (id) => {
  return await Insumo.findById(id);
};

export const createInsumo = async (data) => {
  const {
    nombre,
    categoria,
    stock_actual,
    stock_minimo,
    unidad,
    proveedor,
    fecha_vencimiento,
  } = data;
  const codigo = await generarCodigo();

  return await Insumo.create({
    codigo,
    nombre,
    categoria,
    stock_actual,
    stock_minimo,
    unidad,
    proveedor,
    fecha_vencimiento: fecha_vencimiento || null,
  });
};

export const updateInsumo = async (id, data) => {
  return await Insumo.findByIdAndUpdate(id, data, { new: true });
};

export const toggleActivoInsumo = async (id) => {
  const insumo = await Insumo.findById(id);
  insumo.activo = !insumo.activo;
  await insumo.save();
  return insumo;
};

export const registrarEntradaInsumo = async (id, cantidad, fecha) => {
  const cantidadNum = Number(cantidad);

  if (!cantidadNum || cantidadNum <= 0 || isNaN(cantidadNum)) {
    throw new Error("La cantidad debe ser un número mayor a 0.");
  }

  const insumo = await Insumo.findById(id);
  if (!insumo) return null;

  insumo.stock_actual += cantidadNum;
  await insumo.save();

  await MovimientoInsumo.create({
    insumo_id: insumo._id,
    tipo: "entrada",
    cantidad: cantidadNum,
    fecha: fecha || new Date(),
    stock_resultante: insumo.stock_actual,
  });

  return insumo;
};

export const getMovimientosPorInsumo = async (insumoId) => {
  return await MovimientoInsumo.find({ insumo_id: insumoId })
    .sort({ fecha: -1 });
};

export const registrarSalidaInsumo = async (id, cantidad, fecha) => {
  const cantidadNum = Number(cantidad);

  if (!cantidadNum || cantidadNum <= 0 || isNaN(cantidadNum)) {
    throw new Error("La cantidad debe ser un número mayor a 0.");
  }

  const insumo = await Insumo.findById(id);
  if (!insumo) return null;

  if (cantidadNum > insumo.stock_actual) {
    throw new Error(`Stock insuficiente. Disponible: ${insumo.stock_actual} ${insumo.unidad}.`);
  }

  insumo.stock_actual -= cantidadNum;
  await insumo.save();

  await MovimientoInsumo.create({
    insumo_id: insumo._id,
    tipo: "salida",
    cantidad: cantidadNum,
    fecha: fecha || new Date(),
    stock_resultante: insumo.stock_actual,
  });

  return insumo;
};