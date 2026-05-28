import mongoose from "mongoose";
import {
    getInsumos,
    getInsumoById,
    createInsumo,
    updateInsumo,
    toggleActivoInsumo
} from "../services/InsumoServices.js";

export const GetInsumos = async (req, res) => {
    try {
        const insumos = await getInsumos();
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const GetInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(404).json({ error: `No existe un insumo con el ID ${id}` });

        const insumo = await getInsumoById(id);
        if (!insumo)
            return res.status(404).json({ error: `No existe un insumo con el ID ${id}` });

        res.status(200).json(insumo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const CreateInsumo = async (req, res) => {
    try {
        const insumo = await createInsumo(req.body);
        res.status(201).json(insumo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const UpdateInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(404).json({ error: `No existe un insumo con el ID ${id}` });

        const insumo = await updateInsumo(id, req.body);
        if (!insumo)
            return res.status(404).json({ error: `No existe un insumo con el ID ${id}` });

        res.status(200).json(insumo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const ToggleActivoInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(404).json({ error: `No existe un insumo con el ID ${id}` });

        const insumo = await toggleActivoInsumo(id);
        if (!insumo)
            return res.status(404).json({ error: `No existe un insumo con el ID ${id}` });

        res.status(200).json(insumo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};