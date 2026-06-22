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

    app.get(`/${version}/insumos`, GetInsumos);
    app.get(`/${version}/insumos/:id`, GetInsumo);
    app.post(`/${version}/insumos`, CreateInsumo);
    app.put(`/${version}/insumos/:id`, UpdateInsumo);
    app.patch(`/${version}/insumos/:id/status`, ToggleActivoInsumo);
    app.patch(`/${version}/insumos/:id/entrada`, RegistrarEntradaInsumo);  
    app.get(`/${version}/insumos/:id/movimientos`, GetMovimientosInsumo);
    app.patch(`/${version}/insumos/:id/salida`, RegistrarSalidaInsumo);
};