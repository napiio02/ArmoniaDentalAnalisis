import MarcaModel from "../models/MarcaModel.js";
import Usuario from "../models/Usuario.js";

const ROL_VISIBILIDAD_TOTAL = "Dentista";

const ESTADOS_PENDIENTES = ["Pendiente aprobación", "Justificada pendiente"];

const esVisibilidadTotal = (rol) => rol === ROL_VISIBILIDAD_TOTAL;

const POPULATE_USUARIO = {
  path: "usuario_id",
  select: "nombre rol_id activo",
  populate: { path: "rol_id", select: "nombre" },
};

const nombreRol = (usuarioPopulado) => usuarioPopulado?.rol_id?.nombre ?? null;

const hoyISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });

const horaActual = () =>
  new Date().toLocaleTimeString("es-CR", {
    timeZone: "America/Costa_Rica",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const calcularHoras = (entrada, salida) => {
  if (!entrada || !salida) return 0;

  const [eh, em] = entrada.split(":").map(Number);
  const [sh, sm] = salida.split(":").map(Number);

  const mins = sh * 60 + sm - (eh * 60 + em);
  if (mins <= 0) return 0;

  return Math.round((mins / 60) * 100) / 100;
};

const construirFiltro = (usuarioSolicitante, { fecha, usuario_id, estado }) => {
  const filtro = {};

  if (esVisibilidadTotal(usuarioSolicitante.rol)) {
    if (usuario_id) filtro.usuario_id = usuario_id;
  } else {
    filtro.usuario_id = usuarioSolicitante._id;
  }

  if (fecha) filtro.fecha = fecha;
  if (estado) filtro.estado = estado;

  return filtro;
};

export const obtenerMarcasService = async (usuarioSolicitante, { fecha, usuario_id, estado }) => {
  const filtro = construirFiltro(usuarioSolicitante, { fecha, usuario_id, estado });

  return MarcaModel.find(filtro)
    .populate(POPULATE_USUARIO)
    .sort({ fecha: -1, createdAt: -1 });
};

export const obtenerJornadaActivaService = async (usuarioSolicitante) => {
  return MarcaModel.findOne({
    usuario_id: usuarioSolicitante._id,
    estado: "En curso",
  }).populate(POPULATE_USUARIO);
};

export const iniciarJornadaService = async (usuarioSolicitante) => {
  const activa = await MarcaModel.findOne({
    usuario_id: usuarioSolicitante._id,
    estado: "En curso",
  });

  if (activa) {
    const error = new Error("Ya tienes una jornada activa.");
    error.statusCode = 409;
    throw error;
  }

  const nueva = await MarcaModel.create({
    usuario_id: usuarioSolicitante._id,
    creado_por: usuarioSolicitante._id,
    fecha: hoyISO(),
    inicio_at: new Date(),
    hora_entrada: horaActual(),
    estado: "En curso",
    tipo_registro: "Automático",
  });

  return MarcaModel.findById(nueva._id).populate(POPULATE_USUARIO);
};

export const finalizarJornadaService = async (usuarioSolicitante) => {
  const activa = await MarcaModel.findOne({
    usuario_id: usuarioSolicitante._id,
    estado: "En curso",
  });

  if (!activa) {
    const error = new Error("No tienes una jornada activa.");
    error.statusCode = 404;
    throw error;
  }

  const salida = horaActual();

  activa.fin_at = new Date();
  activa.hora_salida = salida;
  activa.horas_trabajadas = calcularHoras(activa.hora_entrada, salida);
  activa.estado = "Completa";
  activa.observaciones =
    activa.observaciones || "Jornada registrada automáticamente.";

  await activa.save();

  return MarcaModel.findById(activa._id).populate(POPULATE_USUARIO);
};

export const crearMarcaManualService = async (usuarioSolicitante, datos) => {
  const { fecha, hora_entrada, hora_salida, observaciones } = datos;

  if (!fecha || !hora_entrada || !hora_salida) {
    const error = new Error("Fecha, hora de entrada y hora de salida son obligatorias.");
    error.statusCode = 400;
    throw error;
  }

  if (!observaciones || !observaciones.trim()) {
    const error = new Error("Las marcas manuales requieren una observación.");
    error.statusCode = 400;
    throw error;
  }

  const horas = calcularHoras(hora_entrada, hora_salida);

  if (horas <= 0) {
    const error = new Error("La hora de salida debe ser mayor a la hora de entrada.");
    error.statusCode = 400;
    throw error;
  }

  const puedeElegirEmpleado = esVisibilidadTotal(usuarioSolicitante.rol);
  const usuarioObjetivoId = puedeElegirEmpleado ? datos.usuario_id : usuarioSolicitante._id;

  if (!usuarioObjetivoId) {
    const error = new Error("Debes indicar el empleado.");
    error.statusCode = 400;
    throw error;
  }

  const usuarioObjetivo = await Usuario.findById(usuarioObjetivoId);

  if (!usuarioObjetivo) {
    const error = new Error("El empleado indicado no existe.");
    error.statusCode = 404;
    throw error;
  }

  if (!usuarioObjetivo.activo) {
    const error = new Error("El empleado indicado está deshabilitado.");
    error.statusCode = 400;
    throw error;
  }

  const nueva = await MarcaModel.create({
    usuario_id: usuarioObjetivoId,
    creado_por: usuarioSolicitante._id,
    fecha,
    hora_entrada,
    hora_salida,
    horas_trabajadas: horas,
    observaciones,
    tipo_registro: "Manual",
    estado: puedeElegirEmpleado ? "Completa" : "Pendiente aprobación",
    justificacion: puedeElegirEmpleado
      ? null
      : {
          tipo: "Marca manual",
          hora_sugerida: "",
          motivo: observaciones,
          fecha: new Date(),
        },
  });

  return MarcaModel.findById(nueva._id).populate(POPULATE_USUARIO);
};

export const justificarMarcaService = async (usuarioSolicitante, id, datos) => {
  const { tipo, hora_sugerida, motivo } = datos;

  if (!motivo || !motivo.trim()) {
    const error = new Error("Debes indicar el motivo de la justificación.");
    error.statusCode = 400;
    throw error;
  }

  const marca = await MarcaModel.findById(id);

  if (!marca) {
    const error = new Error("La marca no existe.");
    error.statusCode = 404;
    throw error;
  }

  if (String(marca.usuario_id) !== String(usuarioSolicitante._id)) {
    const error = new Error("No puedes justificar marcas de otro usuario.");
    error.statusCode = 403;
    throw error;
  }

  if (marca.estado === "Justificada pendiente") {
    const error = new Error("Esta marca ya tiene una justificación pendiente de revisión.");
    error.statusCode = 409;
    throw error;
  }

  marca.estado = "Justificada pendiente";
  marca.observaciones = motivo;
  marca.justificacion = {
    tipo: tipo || (marca.hora_salida ? "Corrección de marca" : "Olvidó marcar salida"),
    hora_sugerida: hora_sugerida || "",
    motivo,
    fecha: new Date(),
  };

  await marca.save();

  return MarcaModel.findById(marca._id).populate(POPULATE_USUARIO);
};

export const aprobarMarcaService = async (usuarioSolicitante, id, comentario) => {
  const marca = await MarcaModel.findById(id);

  if (!marca) {
    const error = new Error("La marca no existe.");
    error.statusCode = 404;
    throw error;
  }

  if (!ESTADOS_PENDIENTES.includes(marca.estado)) {
    const error = new Error("Esta marca no está pendiente de aprobación.");
    error.statusCode = 409;
    throw error;
  }

  if (marca.justificacion?.hora_sugerida && !marca.hora_salida) {
    marca.hora_salida = marca.justificacion.hora_sugerida;
  }

  if (marca.hora_entrada && marca.hora_salida) {
    marca.horas_trabajadas = calcularHoras(marca.hora_entrada, marca.hora_salida);
  }

  marca.estado = "Completa";

  if (marca.justificacion) {
    marca.justificacion.revisado_por = usuarioSolicitante._id;
    marca.justificacion.revisado_at = new Date();
    marca.justificacion.comentario_revision = comentario || "";
  }

  await marca.save();

  return MarcaModel.findById(marca._id).populate(POPULATE_USUARIO);
};

export const rechazarMarcaService = async (usuarioSolicitante, id, comentario) => {
  const marca = await MarcaModel.findById(id);

  if (!marca) {
    const error = new Error("La marca no existe.");
    error.statusCode = 404;
    throw error;
  }

  if (!ESTADOS_PENDIENTES.includes(marca.estado)) {
    const error = new Error("Esta marca no está pendiente de aprobación.");
    error.statusCode = 409;
    throw error;
  }

  marca.estado = "Rechazada";

  if (marca.justificacion) {
    marca.justificacion.revisado_por = usuarioSolicitante._id;
    marca.justificacion.revisado_at = new Date();
    marca.justificacion.comentario_revision = comentario || "";
  }

  await marca.save();

  return MarcaModel.findById(marca._id).populate(POPULATE_USUARIO);
};

export const obtenerMarcasPendientesService = async () => {
  return MarcaModel.find({ estado: { $in: ESTADOS_PENDIENTES } })
    .populate(POPULATE_USUARIO)
    .sort({ createdAt: 1 });
};

export const obtenerResumenMarcasService = async (usuarioSolicitante) => {
  const filtro = esVisibilidadTotal(usuarioSolicitante.rol)
    ? {}
    : { usuario_id: usuarioSolicitante._id };

  const marcas = await MarcaModel.find(filtro).populate(POPULATE_USUARIO).lean();
  const hoy = hoyISO();

  const marcasHoy = marcas.filter((m) => m.fecha === hoy);
  const horasHoy = marcasHoy.reduce((acc, m) => acc + (m.horas_trabajadas || 0), 0);
  const enJornada = marcas.filter((m) => m.estado === "En curso").length;
  const marcasManuales = marcas.filter((m) => m.tipo_registro === "Manual").length;

  const resumenPorEmpleado = {};

  marcas.forEach((m) => {
    const id = String(m.usuario_id._id);

    if (!resumenPorEmpleado[id]) {
      resumenPorEmpleado[id] = {
        usuario_id: id,
        nombre: m.usuario_id.nombre,
        rol: nombreRol(m.usuario_id),
        totalHoras: 0,
        diasTrabajados: 0,
      };
    }

    resumenPorEmpleado[id].totalHoras += m.horas_trabajadas || 0;
    resumenPorEmpleado[id].diasTrabajados += 1;
  });

  return {
    enJornada,
    horasHoy,
    marcasHoy: marcasHoy.length,
    marcasManuales,
    porEmpleado: Object.values(resumenPorEmpleado),
  };
};