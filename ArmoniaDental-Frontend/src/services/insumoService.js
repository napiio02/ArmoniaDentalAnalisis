
import axios from "axios";

const BASE_URL = "http://localhost:3000/v1/insumos";

export const insumoService = {
    getAll: () => axios.get(BASE_URL),
    getById: (id) => axios.get(`${BASE_URL}/${id}`),
    create: (data) => axios.post(BASE_URL, data),
    update: (id, data) => axios.put(`${BASE_URL}/${id}`, data),
    toggleActivo: (id) => axios.patch(`${BASE_URL}/${id}/status`),
    registrarEntrada: (id, cantidad, fecha) =>
        axios.patch(`${BASE_URL}/${id}/entrada`, { cantidad, fecha }),
    getMovimientos: (id) =>
        axios.get(`${BASE_URL}/${id}/movimientos`),  
    registrarSalida: (id, cantidad, fecha) =>
        axios.patch(`${BASE_URL}/${id}/salida`, { cantidad, fecha }),
};

