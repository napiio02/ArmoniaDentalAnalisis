import CitaModel from "../models/CitaModel.js";

const DURACIONES = {
  Limpieza: 45,
  Revisión: 30,
  Cirugía: 120,
  Blanqueamiento: 60,
  Ortodoncia: 30,
  Empaste: 60,
  Radiografía: 20,
};

const ESTADOS_INACTIVOS = ["Cancelada", "No asistió"];

const duracionMs = (tipo) => (DURACIONES[tipo] ?? 30) * 60 * 1000;

const MAX_DURACION_MS =
  Math.max(...Object.values(DURACIONES)) * 60 * 1000;

const horarioChoque = async (fecha_hora, tipo, excludeId = null) => {
  const inicio = new Date(fecha_hora);
  const fin = new Date(inicio.getTime() + duracionMs(tipo));

  const cercanas = await CitaModel.find({
    estado: { $nin: ESTADOS_INACTIVOS },
    fecha_hora: {
      $gte: new Date(inicio.getTime() - MAX_DURACION_MS),
      $lt: fin,
    },
    ...(excludeId && { _id: { $ne: excludeId } }),
  }).populate("paciente_id", "nombre");

  return (
    cercanas.find((c) => {
      const ini = new Date(c.fecha_hora);
      const fini = new Date(ini.getTime() + duracionMs(c.tipo));
      return inicio < fini && fin > ini;
    }) ?? null
  );
}

const mensajeChoque = (choque) => {
  return `Horario ocupado, ya hay una cita de ${choque.tipo} con ${
    choque.paciente_id?.nombre ?? "otro paciente"
  }.`;
}

export const obtenerCitasService = async ({ fecha, estado, tipo, pasadas }) => {
  const filtro = {};

  if (estado) filtro.estado = estado;
  if (tipo) filtro.tipo = tipo;

  if (fecha) {
    const inicio = new Date(`${fecha}T00:00:00`);
    const fin = new Date(`${fecha}T23:59:59.999`);

    filtro.fecha_hora = {
      $gte: inicio,
      $lte: fin,
    };
  } else if (pasadas !== "true") {
    filtro.fecha_hora = { $gte: new Date() };
  }

  return CitaModel.find(filtro)
    .populate("paciente_id", "nombre cedula telefono")
    .populate("usuario_id", "nombre email")
    .sort({ fecha_hora: 1 });
}

export const obtenerDisponibilidadService = async ({ fecha, tipo }) => {
  if (!fecha || !tipo) {
    const error = new Error("Fecha y tipo son requeridos");
    error.statusCode = 400;
    throw error;
  }

  const slots = [];
  const ahora = new Date();

  const inicioDia = new Date(`${fecha}T08:00:00`);
  const finDia = new Date(`${fecha}T17:00:00`);

  for (
    let actual = new Date(inicioDia);
    actual < finDia;
    actual = new Date(actual.getTime() + 30 * 60 * 1000)
  ) {
    if (actual < ahora) continue;

    const choque = await horarioChoque(actual, tipo);

    slots.push({
      fecha_hora: actual,
      disponible: !choque,
    });
  }

  return slots;
}

export const obtenerCitaPorIdService = async (id) => {
  const cita = await CitaModel.findById(id)
    .populate("paciente_id", "nombre cedula telefono correo")
    .populate("usuario_id", "nombre email");

  if (!cita) {
    const error = new Error("Cita no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return cita;
}

export const crearCitaService = async (datos) => {
  const { paciente_id, usuario_id, fecha_hora, tipo, motivo, observaciones } =
    datos;

  if (new Date(fecha_hora) < new Date()) {
    const error = new Error("No se pueden ingresar fechas pasadas");
    error.statusCode = 400;
    throw error;
  }

  const choque = await horarioChoque(fecha_hora, tipo);

  if (choque) {
    const error = new Error(mensajeChoque(choque));
    error.statusCode = 409;
    throw error;
  }

  const nueva = await CitaModel.create({
    paciente_id,
    usuario_id,
    fecha_hora,
    tipo,
    motivo,
    observaciones: observaciones || "",
    estado: "Programada",
  });

  return CitaModel.findById(nueva._id)
    .populate("paciente_id", "nombre cedula telefono")
    .populate("usuario_id", "nombre email");
}

export const actualizarCitaService = async (id, datos) => {
  const { fecha_hora, tipo, estado, motivo, observaciones } = datos;

  const cita = await CitaModel.findById(id);

  if (!cita) {
    const error = new Error("Cita no encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (cita.estado === "Cancelada") {
    const error = new Error("No se puede actualizar una cita cancelada");
    error.statusCode = 400;
    throw error;
  }

  if (fecha_hora && new Date(fecha_hora) < new Date()) {
    const error = new Error("No se pueden ingresar fechas pasadas");
    error.statusCode = 400;
    throw error;
  }

  if (fecha_hora) {
    const choque = await horarioChoque(fecha_hora, tipo ?? cita.tipo, id);

    if (choque) {
      const error = new Error(mensajeChoque(choque));
      error.statusCode = 409;
      throw error;
    }
  }

  return CitaModel.findByIdAndUpdate(
    id,
    {
      fecha_hora,
      tipo,
      estado,
      motivo,
      observaciones,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("paciente_id", "nombre cedula telefono")
    .populate("usuario_id", "nombre email");
}

export const cancelarCitaService = async (id) => {
  const cita = await CitaModel.findById(id);

  if (!cita) {
    const error = new Error("Cita no encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (cita.estado === "Cancelada") {
    const error = new Error("La cita ya está cancelada");
    error.statusCode = 400;
    throw error;
  }

  cita.estado = "Cancelada";
  await cita.save();

  return cita;
}

export const getCitasAtendidasPorPacienteService = async (paciente_id) => {
  return await CitaModel.find({
    paciente_id,
    estado: "Atendida",
  })
    .sort({ fecha_hora: -1 })
    .lean();
};