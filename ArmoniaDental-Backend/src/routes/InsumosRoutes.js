import { verifyToken } from "../middlewares/VerifyToken.js";
import {
    GetInsumos,
    GetInsumo,
    CreateInsumo,
    UpdateInsumo,
    ToggleActivoInsumo,
    RegistrarEntradaInsumo,
    GetMovimientosInsumo,
    RegistrarSalidaInsumo,
} from "../controllers/InsumoController.js";

export const InsumosRoutes = (app) => {
    const version = process.env.VERSION || "v1";

    app.get(`/${version}/insumos`, verifyToken, GetInsumos);
    app.get(`/${version}/insumos/:id`, verifyToken, GetInsumo);
    app.post(`/${version}/insumos`, verifyToken, CreateInsumo);
    app.put(`/${version}/insumos/:id`, verifyToken, UpdateInsumo);
    app.patch(`/${version}/insumos/:id/status`, verifyToken, ToggleActivoInsumo);
    app.patch(`/${version}/insumos/:id/entrada`, verifyToken, RegistrarEntradaInsumo);
    app.get(`/${version}/insumos/:id/movimientos`, verifyToken, GetMovimientosInsumo);
    app.patch(`/${version}/insumos/:id/salida`, verifyToken, RegistrarSalidaInsumo);
};
