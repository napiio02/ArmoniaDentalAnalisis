/*
 * Utilidades puras de la agenda (sin base de datos): horario de atención, días no
 * laborables y programación de recordatorios. Todo se calcula en hora de Costa Rica.
 */

export const ZONA_HORARIA = "America/Costa_Rica";
export const TZ_OFFSET = "-06:00"; // Costa Rica no usa horario de verano

export const DURACIONES = {
  Limpieza: 45,
  Revisión: 30,
  Cirugía: 120,
  Blanqueamiento: 60,
  Ortodoncia: 30,
  Empaste: 60,
  Radiografía: 20,
};

export const duracionCita = (tipo) => DURACIONES[tipo] ?? 30;

// diasNoLaborables: 0 = domingo ... 6 = sábado
export const CONFIG_POR_DEFECTO = Object.freeze({
  horaInicio: "09:00",
  horaFin: "18:00",
  diasNoLaborables: [0],
  fechasNoLaborables: [],
});

export const RECORDATORIOS = Object.freeze({
  horaVispera: "16:00", // día laboral anterior a la cita
  horaManana: "07:00", // mismo día de la cita
  citaDesdeParaManana: "10:00", // el de la mañana solo aplica a citas de esta hora en adelante
  silencioDesde: "20:00", // no se envían mensajes entre las 8 p. m. y las 7 a. m.
  silencioHasta: "07:00",
  graciaMin: 180, // un recordatorio puede salir hasta 3 h tarde (si el servidor estuvo caído)
  anticipoMinimoMananaMin: 60, // el de la mañana no sale a menos de 1 h de la cita
  margenCreacionMin: 180, // si la cita se crea a menos de 3 h del recordatorio, se omite
});

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_PLURAL = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];

export const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n) => String(n).padStart(2, "0");

export const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const deMinutos = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export const formatoHora12 = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? "p. m." : "a. m."}`;
};

/* ── Fechas en hora de Costa Rica ── */
export const fechaCR = (fecha) =>
  new Date(fecha).toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA }); // AAAA-MM-DD

export const minutosCR = (fecha) => {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(fecha));
  const h = Number(partes.find((p) => p.type === "hour").value);
  const m = Number(partes.find((p) => p.type === "minute").value);
  return h * 60 + m;
};

// "2026-10-12" + "16:00" -> Date (instante exacto en hora de Costa Rica)
export const aFechaCR = (iso, hhmm = "00:00") => new Date(`${iso}T${hhmm}:00${TZ_OFFSET}`);

export const fechaValida = (iso) => {
  if (typeof iso !== "string" || !FECHA_RE.test(iso)) return false;
  const d = new Date(`${iso}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(iso);
};

export const sumarDiasISO = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const diaSemanaISO = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

export const textoFechaLarga = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-CR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

/* ── Configuración del horario ── */
const error400 = (mensaje) => {
  const error = new Error(mensaje);
  error.statusCode = 400;
  return error;
};

// Valida y limpia lo que llega del front. Lo que no venga se toma de la configuración actual.
export const normalizarConfiguracion = (datos = {}, actual = CONFIG_POR_DEFECTO) => {
  const horaInicio = datos.horaInicio ?? actual.horaInicio;
  const horaFin = datos.horaFin ?? actual.horaFin;

  if (!HORA_RE.test(horaInicio) || !HORA_RE.test(horaFin)) {
    throw error400("Las horas de apertura y cierre deben tener el formato HH:MM.");
  }
  const duracion = aMinutos(horaFin) - aMinutos(horaInicio);
  if (duracion <= 0) throw error400("La hora de cierre debe ser posterior a la hora de apertura.");
  if (duracion < 30) throw error400("El horario de atención debe durar al menos 30 minutos.");

  let dias = datos.diasNoLaborables ?? actual.diasNoLaborables;
  if (!Array.isArray(dias) || dias.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    throw error400("Los días de la semana indicados no son válidos.");
  }
  dias = [...new Set(dias)].sort((a, b) => a - b);
  if (dias.length >= 7) throw error400("Debe quedar al menos un día de atención a la semana.");

  const fechas = datos.fechasNoLaborables ?? actual.fechasNoLaborables;
  if (!Array.isArray(fechas) || fechas.length > 400) {
    throw error400("La lista de fechas sin atención no es válida.");
  }
  const porFecha = new Map();
  for (const item of fechas) {
    if (!fechaValida(item?.fecha)) throw error400(`La fecha ${item?.fecha} no es válida.`);
    porFecha.set(item.fecha, String(item.motivo ?? "").trim().slice(0, 120));
  }
  const fechasNoLaborables = [...porFecha.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, motivo]) => ({ fecha, motivo }));

  return { horaInicio, horaFin, diasNoLaborables: dias, fechasNoLaborables };
};

/* ── ¿Se atiende ese día? ── */
export const esDiaLaboral = (iso, config) => {
  const extra = config.fechasNoLaborables.find((f) => f.fecha === iso);
  if (extra) return { laboral: false, motivo: extra.motivo || "Día sin atención" };

  const dia = diaSemanaISO(iso);
  if (config.diasNoLaborables.includes(dia)) {
    return { laboral: false, motivo: `No se atiende los ${DIAS_PLURAL[dia]}` };
  }
  return { laboral: true, motivo: "" };
};

// null si la cita es válida; si no, el mensaje de error para mostrar
export const validarHorarioCita = (fechaHora, duracionMin, config) => {
  const iso = fechaCR(fechaHora);
  const dia = esDiaLaboral(iso, config);
  if (!dia.laboral) return `No hay atención el ${textoFechaLarga(iso)}: ${dia.motivo}.`;

  const inicio = minutosCR(fechaHora);
  if (inicio < aMinutos(config.horaInicio) || inicio + duracionMin > aMinutos(config.horaFin)) {
    return (
      `La cita debe quedar dentro del horario de atención ` +
      `(${formatoHora12(config.horaInicio)} a ${formatoHora12(config.horaFin)}).`
    );
  }
  return null;
};

// Horarios de inicio posibles (cada 30 min) para un día y una duración
export const generarSlots = ({ fecha, duracionMin, config, ahora = new Date() }) => {
  if (!esDiaLaboral(fecha, config).laboral) return [];

  const slots = [];
  const cierre = aMinutos(config.horaFin);
  for (let t = aMinutos(config.horaInicio); t + duracionMin <= cierre; t += 30) {
    const inicio = aFechaCR(fecha, deMinutos(t));
    if (inicio >= ahora) slots.push(inicio);
  }
  return slots;
};

/* ── Recordatorios ──
 * Víspera: 4:00 p. m. del día laboral anterior (si la cita es lunes, sale el sábado).
 * Mañana:  7:00 a. m. del día de la cita, solo para citas de las 10:00 en adelante y solo
 *          si el paciente todavía no confirmó.
 * Nunca se envía entre las 8:00 p. m. y las 7:00 a. m.
 */
export const programarRecordatorios = (fechaHoraCita, config) => {
  const isoCita = fechaCR(fechaHoraCita);

  let iso = sumarDiasISO(isoCita, -1);
  for (let i = 0; i < 31 && !esDiaLaboral(iso, config).laboral; i++) iso = sumarDiasISO(iso, -1);

  return {
    vispera: aFechaCR(iso, RECORDATORIOS.horaVispera),
    manana:
      minutosCR(fechaHoraCita) >= aMinutos(RECORDATORIOS.citaDesdeParaManana)
        ? aFechaCR(isoCita, RECORDATORIOS.horaManana)
        : null,
  };
};

export const enSilencio = (ahora = new Date()) => {
  const m = minutosCR(ahora);
  return m >= aMinutos(RECORDATORIOS.silencioDesde) || m < aMinutos(RECORDATORIOS.silencioHasta);
};

// Banderas iniciales al crear o reagendar: los recordatorios que ya no tienen sentido quedan "enviados"
export const calcularFlagsRecordatorio = (fechaHora, config, ahora = new Date()) => {
  const { vispera, manana } = programarRecordatorios(fechaHora, config);
  const margen = RECORDATORIOS.margenCreacionMin * 60000;
  return {
    recordatorioVisperaEnviado: ahora.getTime() > vispera.getTime() - margen,
    recordatorioMananaEnviado: manana ? ahora.getTime() > manana.getTime() - margen : true,
  };
};

// Qué recordatorios ("vispera" | "manana") le corresponde enviar ahora a una cita
export const recordatoriosPendientes = (cita, config, ahora = new Date()) => {
  if (enSilencio(ahora)) return [];

  const t = ahora.getTime();
  const citaMs = new Date(cita.fecha_hora).getTime();
  if (t >= citaMs) return [];

  const gracia = RECORDATORIOS.graciaMin * 60000;
  const { vispera, manana } = programarRecordatorios(cita.fecha_hora, config);
  const pendientes = [];

  // recordatorio24Enviado / recordatorio12Enviado: banderas del esquema anterior
  const visperaEnviada = cita.recordatorioVisperaEnviado === true || cita.recordatorio24Enviado === true;
  if (!visperaEnviada && t >= vispera.getTime() && t <= Math.min(vispera.getTime() + gracia, citaMs)) {
    pendientes.push("vispera");
  }

  const mananaEnviada = cita.recordatorioMananaEnviado === true || cita.recordatorio12Enviado === true;
  if (
    manana &&
    cita.estado === "Programada" &&
    !mananaEnviada &&
    t >= manana.getTime() &&
    t <= Math.min(manana.getTime() + gracia, citaMs - RECORDATORIOS.anticipoMinimoMananaMin * 60000)
  ) {
    pendientes.push("manana");
  }

  return pendientes;
};
