import CitaModel from "../models/CitaModel.js";
import { enviarMensajePlantilla } from "./WhatsappService.js";
import { notificarCancelacionCita } from "./RecordatorioService.js";
import { obtenerConfiguracionAgenda } from "./ConfiguracionAgendaService.js";
import {
  DURACIONES,
  TZ_OFFSET,
  ZONA_HORARIA,
  aFechaCR,
  calcularFlagsRecordatorio,
  duracionCita,
  fechaValida,
  generarSlots,
  sumarDiasISO,
  validarHorarioCita,
} from "../utils/AgendaUtils.js";

const ESTADOS_INACTIVOS = ["Cancelada", "No asistió"];

const duracionMs = (tipo) => duracionCita(tipo) * 60 * 1000;

const MAX_DURACION_MS = Math.max(...Object.values(DURACIONES)) * 60 * 1000;

// Convierte a Date. Si el texto no trae zona horaria (ej. "2026-10-01T09:00"),
// se interpreta como hora de Costa Rica y no como la hora del servidor (UTC).
const aFechaHoraCR = (valor) => {
  if (!valor || valor instanceof Date) return valor;
  const texto = String(valor);
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(texto)) return new Date(texto);
  return new Date(`${texto}${texto.length === 16 ? ":00" : ""}${TZ_OFFSET}`);
};

const lanzarError = (mensaje, statusCode) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  throw error;
};

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
};

const mensajeChoque = (choque) =>
  `Horario ocupado, ya hay una cita de ${choque.tipo} con ${
    choque.paciente_id?.nombre ?? "otro paciente"
  }.`;

const formatearFechaHora = (fecha_hora) => {
  const fecha = new Date(fecha_hora);
  return {
    fechaTexto: fecha.toLocaleDateString("es-CR", {
      timeZone: ZONA_HORARIA,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    horaTexto: fecha.toLocaleTimeString("es-CR", {
      timeZone: ZONA_HORARIA,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

export const obtenerCitasService = async ({ fecha, estado, tipo, pasadas }) => {
  const filtro = {};

  if (estado) filtro.estado = estado;
  if (tipo) filtro.tipo = tipo;

  if (fecha) {
    filtro.fecha_hora = {
      $gte: new Date(`${fecha}T00:00:00${TZ_OFFSET}`),
      $lte: new Date(`${fecha}T23:59:59.999${TZ_OFFSET}`),
    };
  } else if (pasadas !== "true") {
    filtro.fecha_hora = { $gte: new Date() };
  }

  return CitaModel.find(filtro)
    .populate("paciente_id", "nombre cedula telefono")
    .populate("usuario_id", "nombre email")
    .sort({ fecha_hora: 1 });
};

// Horarios de inicio del día según el horario de atención configurado, marcando los ocupados
export const obtenerDisponibilidadService = async ({ fecha, tipo }) => {
  if (!fecha || !tipo) lanzarError("Fecha y tipo son requeridos", 400);
  if (!fechaValida(fecha)) lanzarError("La fecha no es válida", 400);

  const config = await obtenerConfiguracionAgenda();
  const inicios = generarSlots({ fecha, duracionMin: duracionCita(tipo), config });

  // Día sin atención, o ya no quedan horarios hoy
  if (inicios.length === 0) return [];

  // Una sola consulta para todo el día (antes era una por cada horario)
  const citas = await CitaModel.find({
    estado: { $nin: ESTADOS_INACTIVOS },
    fecha_hora: {
      $gte: new Date(aFechaCR(fecha).getTime() - MAX_DURACION_MS),
      $lt: aFechaCR(sumarDiasISO(fecha, 1)),
    },
  })
    .select("fecha_hora tipo")
    .lean();

  const ocupadas = citas.map((c) => {
    const ini = new Date(c.fecha_hora).getTime();
    return [ini, ini + duracionMs(c.tipo)];
  });

  return inicios.map((inicio) => {
    const ini = inicio.getTime();
    const fin = ini + duracionMs(tipo);
    const choque = ocupadas.some(([a, b]) => ini < b && fin > a);
    return { fecha_hora: inicio, disponible: !choque };
  });
};

export const obtenerCitaPorIdService = async (id) => {
  const cita = await CitaModel.findById(id)
    .populate("paciente_id", "nombre cedula telefono correo")
    .populate("usuario_id", "nombre email");

  if (!cita) lanzarError("Cita no encontrada", 404);

  return cita;
};

export const crearCitaService = async (datos) => {
  const { paciente_id, usuario_id, tipo, motivo, observaciones } = datos;
  const fecha_hora = aFechaHoraCR(datos.fecha_hora);

  if (fecha_hora < new Date()) {
    lanzarError("No se pueden ingresar fechas pasadas", 400);
  }

  const config = await obtenerConfiguracionAgenda();
  const errorHorario = validarHorarioCita(fecha_hora, duracionCita(tipo), config);
  if (errorHorario) lanzarError(errorHorario, 400);

  const choque = await horarioChoque(fecha_hora, tipo);
  if (choque) lanzarError(mensajeChoque(choque), 409);

  // Las banderas de recordatorio omiten los que ya no tienen sentido (ej. cita creada para mañana a las 3 p. m.)
  const nueva = await CitaModel.create({
    paciente_id,
    usuario_id,
    fecha_hora,
    tipo,
    motivo,
    observaciones: observaciones || "",
    estado: "Programada",
    ...calcularFlagsRecordatorio(fecha_hora, config),
  });

  const citaCompleta = await CitaModel.findById(nueva._id)
    .populate("paciente_id", "nombre cedula telefono")
    .populate("usuario_id", "nombre email");

  if (citaCompleta.paciente_id?.telefono) {
    const { fechaTexto, horaTexto } = formatearFechaHora(fecha_hora);

    // WhatsappService normaliza el teléfono (agrega 506 si hace falta)
    enviarMensajePlantilla({
      telefono: citaCompleta.paciente_id.telefono,
      nombrePlantilla: "confirmacion_cita",
      parametrosNombrados: {
        nombre_paciente: citaCompleta.paciente_id.nombre,
        tipo_cita: tipo,
        fecha_cita: fechaTexto,
        hora_cita: horaTexto,
      },
      citaId: nueva._id.toString(),
    }).catch((err) =>
      console.error("No se pudo enviar WhatsApp de confirmación:", err.message)
    );
  }

  return citaCompleta;
};

export const actualizarCitaService = async (id, datos) => {
  const { tipo, estado, motivo, observaciones } = datos;
  const fecha_hora = aFechaHoraCR(datos.fecha_hora);

  const cita = await CitaModel.findById(id);

  if (!cita) lanzarError("Cita no encontrada", 404);
  if (cita.estado === "Cancelada") {
    lanzarError("No se puede actualizar una cita cancelada", 400);
  }

  const cambioFecha =
    Boolean(fecha_hora) &&
    fecha_hora.getTime() !== new Date(cita.fecha_hora).getTime();
  const cambioTipo = Boolean(tipo) && tipo !== cita.tipo;

  // Solo se valida la fecha, el horario de atención y el choque si realmente cambió la fecha o el tipo.
  // Así se puede, por ejemplo, marcar como Atendida una cita que ya pasó.
  if (cambioFecha && fecha_hora < new Date()) {
    lanzarError("No se pueden ingresar fechas pasadas", 400);
  }

  const actualizacion = { fecha_hora, tipo, estado, motivo, observaciones };

  if (cambioFecha || cambioTipo) {
    const nuevaFecha = fecha_hora ?? cita.fecha_hora;
    const nuevoTipo = tipo ?? cita.tipo;

    const config = await obtenerConfiguracionAgenda();
    const errorHorario = validarHorarioCita(nuevaFecha, duracionCita(nuevoTipo), config);
    if (errorHorario) lanzarError(errorHorario, 400);

    const choque = await horarioChoque(nuevaFecha, nuevoTipo, id);
    if (choque) lanzarError(mensajeChoque(choque), 409);

    // Si la cita se reagenda, los recordatorios se reinician para la nueva fecha
    if (cambioFecha) Object.assign(actualizacion, calcularFlagsRecordatorio(fecha_hora, config));
  }

  const seCancela = estado === "Cancelada" && cita.estado !== "Cancelada";

  const actualizada = await CitaModel.findByIdAndUpdate(id, actualizacion, {
    new: true,
    runValidators: true,
  })
    .populate("paciente_id", "nombre cedula telefono")
    .populate("usuario_id", "nombre email");

  // Sin await: no debe bloquear ni romper la respuesta si WhatsApp falla
  if (seCancela) notificarCancelacionCita(id);

  return actualizada;
};

export const cancelarCitaService = async (id) => {
  const cita = await CitaModel.findById(id);

  if (!cita) lanzarError("Cita no encontrada", 404);
  if (cita.estado === "Cancelada") lanzarError("La cita ya está cancelada", 400);

  cita.estado = "Cancelada";
  await cita.save();

  // Sin await: no debe bloquear ni romper la cancelación si WhatsApp falla
  notificarCancelacionCita(cita._id);

  return cita;
};

export const getCitasAtendidasPorPacienteService = (paciente_id) =>
  CitaModel.find({ paciente_id, estado: "Atendida" })
    .sort({ fecha_hora: -1 })
    .lean();
