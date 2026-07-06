import mongoose from "mongoose";
import {
  obtenerCitasService,
  obtenerDisponibilidadService,
  obtenerCitaPorIdService,
  crearCitaService,
  actualizarCitaService,
  cancelarCitaService,
  getCitasAtendidasPorPacienteService,
} from "../services/CitasServices.js";

const responderError = (res, error, mensajeDefault) => {
  console.error(mensajeDefault, error);

  if (error.name === "ValidationError") {
    const msgs = Object.values(error.errors).map((e) => e.message);

    return res.status(400).json({
      message: msgs.join(", "),
    });
  }

  return res.status(error.statusCode || 500).json({
    message: error.message || mensajeDefault,
  });
}

export const getCitas = async (req, res) => {
  try {
    const citas = await obtenerCitasService(req.query);
    return res.json(citas);
  } catch (error) {
    return responderError(res, error, "Error al obtener citas");
  }
};

export const getDisponibilidad = async (req, res) => {
  try {
    const slots = await obtenerDisponibilidadService(req.query);
    return res.json(slots);
  } catch (error) {
    return responderError(res, error, "Error obteniendo disponibilidad");
  }
};

export const getCitaById = async (req, res) => {
  try {
    const cita = await obtenerCitaPorIdService(req.params.id);
    return res.json(cita);
  } catch (error) {
    return responderError(res, error, "Error al obtener la cita");
  }
};

export const createCita = async (req, res) => {
  try {
    const cita = await crearCitaService(req.body);
    return res.status(201).json(cita);
  } catch (error) {
    return responderError(res, error, "Error al crear la cita");
  }
};

export const updateCita = async (req, res) => {
  try {
    const cita = await actualizarCitaService(req.params.id, req.body);
    return res.json(cita);
  } catch (error) {
    return responderError(res, error, "Error al actualizar la cita");
  }
};

export const cancelarCita = async (req, res) => {
  try {
    const cita = await cancelarCitaService(req.params.id);

    return res.json({
      message: "Cita cancelada",
      cita,
    });
  } catch (error) {
    return responderError(res, error, "Error al cancelar la cita");
  }
};

export const getCitasAtendidasPorPaciente = async (req, res) => {
  try {
    const { paciente_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(paciente_id)) {
      return res.status(404).json({ ok: false, message: "Paciente no válido." });
    }
    const citas = await getCitasAtendidasPorPacienteService(paciente_id);
    return res.status(200).json({
      ok: true,
      message: "Citas obtenidas correctamente.",
      data: citas,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
};