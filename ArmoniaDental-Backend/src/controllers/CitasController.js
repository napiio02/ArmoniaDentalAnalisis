import CitaModel from "../models/CitaModel.js";

export const getCitas = async (req, res) => {
  try {
    const { fecha, estado, tipo, pasadas } = req.query;

    const filtro = {};

 
    if (estado) filtro.estado = estado;

   
    if (tipo) filtro.tipo = tipo;

   
    if (fecha) {
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);
      filtro.fecha_hora = { $gte: inicio, $lte: fin };
    }


    if (!fecha && pasadas !== "true") {
      filtro.fecha_hora = { ...filtro.fecha_hora, $gte: new Date() };
    }

    const citas = await CitaModel.find(filtro)
      .populate("paciente_id", "nombre cedula telefono")
      .populate("usuario_id", "nombre email")
      .sort({ fecha_hora: 1 });

    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ message: "Error" });
  }
};

export const getCitaById = async (req, res) => {
  try {
    const cita = await CitaModel.findById(req.params.id)
      .populate("paciente_id", "nombre cedula telefono correo")
      .populate("usuario_id", "nombre email");

    if (!cita) {
      return res.status(404).json({ message: "No se encontro la cita" });
    }

    res.json(cita);
  } catch (error) {
    console.error("Error al obtener cita:", error);
    res.status(500).json({ message: "Error" });
  }
};


export const createCita = async (req, res) => {
  try {
    const { paciente_id, usuario_id, fecha_hora, tipo, motivo, observaciones } =
      req.body;

    o
    if (new Date(fecha_hora) < new Date()) {
      return res
        .status(400)
        .json({ message: "Solo de permiten fechas actuales" });
    }

    const nuevaCita = new CitaModel({
      paciente_id,
      usuario_id,
      fecha_hora,
      tipo,
      motivo,
      observaciones: observaciones || "",
      estado: "Programada",
    });

    await nuevaCita.save();


    const citaPopulada = await CitaModel.findById(nuevaCita._id)
      .populate("paciente_id", "nombre cedula telefono")
      .populate("usuario_id", "nombre email");

    res.status(201).json(citaPopulada);
  } catch (error) {
    console.error("Error al crear cita:", error);

    if (error.name === "ValidationError") {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: mensajes.join(", ") });
    }

    res.status(500).json({ message: "Error" });
  }
};

export const updateCita = async (req, res) => {
  try {
    const { fecha_hora, tipo, estado, motivo, observaciones } = req.body;

    const cita = await CitaModel.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ message: "No se encontro la cita" });
    }

    // no permitir editar una cita ya cancelada
    if (cita.estado === "Cancelada") {
      return res
        .status(400)
        .json({ message: "No se pudo actualizar la cita" });
    }

    if (fecha_hora && new Date(fecha_hora) < new Date()) {
      return res
        .status(400)
        .json({ message: "Solo de permiten fechas actuales" });
    }

    const actualizada = await CitaModel.findByIdAndUpdate(
      req.params.id,
      { fecha_hora, tipo, estado, motivo, observaciones },
      { new: true, runValidators: true }
    )
      .populate("paciente_id", "nombre cedula telefono")
      .populate("usuario_id", "nombre email");

    res.json(actualizada);
  } catch (error) {
    console.error("No se pudo actualizar la cita", error);

    if (error.name === "ValidationError") {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: mensajes.join(", ") });
    }

    res.status(500).json({ message: "Error" });
  }
};

export const cancelarCita = async (req, res) => {
  try {
    const cita = await CitaModel.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({ message: "No se pudo encontrar una cita" });
    }

    if (cita.estado === "Cancelada") {
      return res.status(400).json({ message: "Cita ya cancelada" });
    }

    cita.estado = "Cancelada";
    await cita.save();

    res.json({ message: "Cita cancelada", cita });
  } catch (error) {
    console.error("Error al cancelar cita:", error);
    res.status(500).json({ message: "Error" });
  }
};

