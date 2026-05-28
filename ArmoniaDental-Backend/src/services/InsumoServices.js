import Insumo from "../models/Insumo.js";

const generarCodigo = async () => {
    const ultimoInsumo = await Insumo.findOne({
        codigo: new RegExp(`^INS-`)
    }).sort({ codigo: -1 }).limit(1);

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
    const { nombre, categoria, stock_actual, stock_minimo, unidad, proveedor } = data;
    const codigo = await generarCodigo();
    return await Insumo.create({
        codigo, nombre, categoria, stock_actual, stock_minimo, unidad, proveedor
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