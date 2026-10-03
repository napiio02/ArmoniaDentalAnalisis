import CitaModel from "../models/CitaModel.js";
import { enviarMensajePlantilla } from "./WhatsappService.js";
import {
  notificarCancelacionCita,
  flagsRecordatorioPara,
} from "./RecordatorioService.js";

const ZONA_HORARIA = "America/Costa_Rica";
const TZ_OFFSET = "-06:00"; // Costa Rica no usa horario de verano

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

const MAX_DURACION_MS = Math.max(...Object.values(DURACIONES)) * 60 * 1000;

// Convierte a Date. Si el texto no trae zona horaria (ej. "2026-10-01T09:00"),
// se interpreta como hora de Costa Rica y no como la hora del servidor (UTC).
const aFechaCR = (valor) => {
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

export const obtenerDisponibilidadService = async ({ fecha, tipo }) => {
  if (!fecha || !tipo) lanzarError("Fecha y tipo son requeridos", 400);

  const slots = [];
  const ahora = new Date();

  const inicioDia = new Date(`${fecha}T08:00:00${TZ_OFFSET}`);
  const finDia = new Date(`${fecha}T17:00:00${TZ_OFFSET}`);

  for (
    let actual = new Date(inicioDia);
    actual < finDia;
    actual = new Date(actual.getTime() + 30 * 60 * 1000)
  ) {
    if (actual < ahora) continue;

    const choque = await horarioChoque(actual, tipo);
    slots.push({ fecha_hora: actual, disponible: !choque });
  }

  return slots;
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
  const fecha_hora = aFechaCR(datos.fecha_hora);

  if (fecha_hora < new Date()) {
    lanzarError("No se pueden ingresar fechas pasadas", 400);
  }

  const choque = await horarioChoque(fecha_hora, tipo);
  if (choque) lanzarError(mensajeChoque(choque), 409);

  // Los flags de recordatorio se ajustan solos en el hook pre("save") del modelo
  const nueva = await CitaModel.create({
    paciente_id,
    usuario_id,
    fecha_hora,
    tipo,
    motivo,
    observaciones: observaciones || "",
    estado: "Programada",
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
  const fecha_hora = aFechaCR(datos.fecha_hora);

  const cita = await CitaModel.findById(id);

  if (!cita) lanzarError("Cita no encontrada", 404);
  if (cita.estado === "Cancelada") {
    lanzarError("No se puede actualizar una cita cancelada", 400);
  }

  const cambioFecha =
    Boolean(fecha_hora) &&
    fecha_hora.getTime() !== new Date(cita.fecha_hora).getTime();
  const cambioTipo = Boolean(tipo) && tipo !== cita.tipo;

  // Solo se valida la fecha y el choque de horario si realmente cambió la fecha o el tipo.
  // Así se puede, por ejemplo, marcar como Atendida una cita que ya pasó.
  if (cambioFecha && fecha_hora < new Date()) {
    lanzarError("No se pueden ingresar fechas pasadas", 400);
  }

  if (cambioFecha || cambioTipo) {
    const choque = await horarioChoque(
      fecha_hora ?? cita.fecha_hora,
      tipo ?? cita.tipo,
      id
    );
    if (choque) lanzarError(mensajeChoque(choque), 409);
  }

  const actualizacion = { fecha_hora, tipo, estado, motivo, observaciones };

  // Si la cita se reagenda, los recordatorios se reinician para la nueva fecha
  if (cambioFecha) Object.assign(actualizacion, flagsRecordatorioPara(fecha_hora));

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