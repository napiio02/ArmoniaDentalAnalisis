import CitaModel from "../models/CitaModel.js";

const DURACIONES = {
  Limpieza: 45, Revisión: 30, Cirugía: 120,
  Blanqueamiento: 60, Ortodoncia: 30, Empaste: 60, Radiografía: 20,
};

const duracionMs = (tipo) => (DURACIONES[tipo] ?? 30) * 60 * 1000;
const MAX_DURACION_MS = Math.max(...Object.values(DURACIONES)) * 60 * 1000; // 120 min

async function horarioChoque(fecha_hora, tipo, excludeId = null) {
  const inicio = new Date(fecha_hora);
  const fin = new Date(inicio.getTime() + duracionMs(tipo));


  const cercanas = await CitaModel.find({
    estado: { $nin: ["Cancelada", "No asistió"] },
    fecha_hora: {
      $gte: new Date(inicio.getTime() - MAX_DURACION_MS),
      $lt: fin,
    },
    ...(excludeId && { _id: { $ne: excludeId } }),
  }).populate("paciente_id", "nombre");

  return cercanas.find((c) => {
    const ini = new Date(c.fecha_hora);
    const fini = new Date(ini.getTime() + duracionMs(c.tipo));
    return inicio < fini && fin > ini;
  }) ?? null;
}

const mensajeChoque = (choque) =>
  `Horario ocupado, ya hay una cita de ${choque.tipo} con ${choque.paciente_id?.nombre ?? "otro paciente"}.`;


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
    } else if (pasadas !== "true") {
      filtro.fecha_hora = { $gte: new Date() };
    }

    const citas = await CitaModel.find(filtro)
      .populate("paciente_id", "nombre cedula telefono")
      .populate("usuario_id", "nombre email")
      .sort({ fecha_hora: 1 });

    res.json(citas);
  } catch (error) {
    console.error("getCitas:", error);
    res.status(500).json({ message: "Error al obtener citas" });
  }
};


export const getCitaById = async (req, res) => {
  try {
    const cita = await CitaModel.findById(req.params.id)
      .populate("paciente_id", "nombre cedula telefono correo")
      .populate("usuario_id", "nombre email");

    if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
    res.json(cita);
  } catch (error) {
    console.error("getCitaById:", error);
    res.status(500).json({ message: "Error al obtener la cita" });
  }
};


export const createCita = async (req, res) => {
  try {
    const { paciente_id, usuario_id, fecha_hora, tipo, motivo, observaciones } = req.body;

    if (new Date(fecha_hora) < new Date())
      return res.status(400).json({ message: "No se pueden ingresar fechas pasadas" });

    const choque = await horarioChoque(fecha_hora, tipo);
    if (choque) return res.status(409).json({ message: mensajeChoque(choque) });

    const nueva = await CitaModel.create({
      paciente_id, usuario_id, fecha_hora, tipo,
      motivo, observaciones: observaciones || "",
      estado: "Programada",
    });

    const citaPopulada = await CitaModel.findById(nueva._id)
      .populate("paciente_id", "nombre cedula telefono")
      .populate("usuario_id", "nombre email");

    res.status(201).json(citaPopulada);
  } catch (error) {
    console.error("createCita:", error);
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: msgs.join(", ") });
    }
    res.status(500).json({ message: "Error al crear la cita" });
  }
};


export const updateCita = async (req, res) => {
  try {
    const { fecha_hora, tipo, estado, motivo, observaciones } = req.body;

    const cita = await CitaModel.findById(req.params.id);
    if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
    if (cita.estado === "Cancelada")
      return res.status(400).json({ message: "No se puede actualizar una cita cancelada" });
    if (fecha_hora && new Date(fecha_hora) < new Date())
      return res.status(400).json({ message: "No se pueden ingresar fechas pasadas" });

    if (fecha_hora) {
      const choque = await horarioChoque(fecha_hora, tipo ?? cita.tipo, req.params.id);
      if (choque) return res.status(409).json({ message: mensajeChoque(choque) });
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
    console.error("updateCita:", error);
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: msgs.join(", ") });
    }
    res.status(500).json({ message: "Error al actualizar la cita" });
  }
};


export const cancelarCita = async (req, res) => {
  try {
    const cita = await CitaModel.findById(req.params.id);
    if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
    if (cita.estado === "Cancelada")
      return res.status(400).json({ message: "La cita ya está cancelada" });

    cita.estado = "Cancelada";
    await cita.save();
    res.json({ message: "Cita cancelada", cita });
  } catch (error) {
    console.error("cancelarCita:", error);
    res.status(500).json({ message: "Error al cancelar la cita" });
  }
};
