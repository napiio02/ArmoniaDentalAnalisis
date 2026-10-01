import CitaModel from "../models/CitaModel.js";
import { enviarMensajePlantilla } from "./WhatsappService.js";

const HORA_MS = 60 * 60 * 1000;
const ZONA_HORARIA = "America/Costa_Rica";
const ESTADOS_ACTIVOS = ["Programada", "Confirmada"];

// Nombres de plantillas aprobadas en Meta (configurables por variable de entorno)
const plantillaRecordatorio = () =>
  process.env.WHATSAPP_PLANTILLA_RECORDATORIO || "recordatorio_cita";
const plantillaCancelacion = () =>
  process.env.WHATSAPP_PLANTILLA_CANCELACION || "cita_cancelada";

/* ───────── Formato (siempre en hora de Costa Rica, el servidor corre en UTC) ───────── */

const formatearFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-CR", {
    timeZone: ZONA_HORARIA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatearHora = (fecha) =>
  new Date(fecha).toLocaleTimeString("es-CR", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

/*
 * Los nombres de las claves deben ser IGUALES a las variables definidas
 * en las plantillas de Meta: {{nombre_paciente}}, {{tipo_cita}},
 * {{fecha_cita}}, {{hora_cita}}.
 */
const parametrosCita = (cita) => ({
  nombre_paciente: cita.paciente_id?.nombre || "paciente",
  tipo_cita: cita.tipo,
  fecha_cita: formatearFecha(cita.fecha_hora),
  hora_cita: formatearHora(cita.fecha_hora),
});

/* ───────── Recordatorios 24 h y 12 h ───────── */

/*
 * Reclama el envío de forma atómica (marca el flag antes de enviar) para que
 * dos ejecuciones simultáneas del job no manden el mismo mensaje dos veces.
 * Si el envío falla, se libera el flag para reintentar en la próxima corrida.
 */
const enviarRecordatorio = async (cita, campo) => {
  const reclamada = await CitaModel.findOneAndUpdate(
    {
      _id: cita._id,
      estado: { $in: ESTADOS_ACTIVOS },
      [campo]: { $ne: true },
    },
    { $set: { [campo]: true } }
  );

  if (!reclamada) return false;

  try {
    await enviarMensajePlantilla({
      telefono: cita.paciente_id.telefono,
      nombrePlantilla: plantillaRecordatorio(),
      parametrosNombrados: parametrosCita(cita),
      citaId: String(cita._id),
      conBotones: true,
    });
    return true;
  } catch (error) {
    await CitaModel.updateOne({ _id: cita._id }, { $set: { [campo]: false } });
    return false;
  }
};

const procesarVentana = async ({ campo, desde, hasta }) => {
  const citas = await CitaModel.find({
    estado: { $in: ESTADOS_ACTIVOS },
    [campo]: { $ne: true },
    fecha_hora: { $gt: desde, $lte: hasta },
  })
    .populate("paciente_id", "nombre telefono")
    .lean();

  let enviados = 0;
  let fallidos = 0;

  // Una cita = un mensaje. Un paciente con varias citas recibe un recordatorio por cada una.
  for (const cita of citas) {
    if (!cita.paciente_id?.telefono) {
      console.warn(`Cita ${cita._id}: el paciente no tiene teléfono registrado.`);
      fallidos++;
      continue;
    }

    const ok = await enviarRecordatorio(cita, campo);
    ok ? enviados++ : fallidos++;
  }

  return { encontradas: citas.length, enviados, fallidos };
};

/*
 * Ventanas (se ejecuta cada pocos minutos):
 *   - 24 h: citas que empiezan entre dentro de 12 h y dentro de 24 h
 *   - 12 h: citas que empiezan entre ahora y dentro de 12 h
 * Las ventanas no se cruzan, así que cada recordatorio sale una sola vez.
 */
export const enviarRecordatoriosPendientes = async () => {
  const ahora = Date.now();

  const recordatorio24 = await procesarVentana({
    campo: "recordatorio24Enviado",
    desde: new Date(ahora + 12 * HORA_MS),
    hasta: new Date(ahora + 24 * HORA_MS),
  });

  const recordatorio12 = await procesarVentana({
    campo: "recordatorio12Enviado",
    desde: new Date(ahora),
    hasta: new Date(ahora + 12 * HORA_MS),
  });

  return { recordatorio24, recordatorio12 };
};

/*
 * Devuelve los flags que corresponden a una fecha de cita.
 * Si la cita ya está dentro de la ventana de un recordatorio al momento de
 * crearla o reagendarla, ese recordatorio se marca como enviado para no
 * mandar un "recordatorio" inmediato a una cita recién agendada.
 */
export const flagsRecordatorioPara = (fechaHora) => {
  const faltan = new Date(fechaHora).getTime() - Date.now();
  return {
    recordatorio24Enviado: faltan <= 24 * HORA_MS,
    recordatorio12Enviado: faltan <= 12 * HORA_MS,
  };
};

/* ───────── Notificación de cita cancelada ───────── */

/*
 * Nunca lanza error: si WhatsApp falla, la cancelación en el sistema
 * no debe revertirse ni mostrarle un error al usuario.
 */
export const notificarCancelacionCita = async (citaId) => {
  try {
    const cita = await CitaModel.findById(citaId)
      .populate("paciente_id", "nombre telefono")
      .lean();

    if (!cita) return false;

    if (!cita.paciente_id?.telefono) {
      console.warn(`Cita ${citaId}: el paciente no tiene teléfono registrado.`);
      return false;
    }

    // No avisar de cancelaciones de citas que ya pasaron
    if (new Date(cita.fecha_hora) < new Date()) return false;

    await enviarMensajePlantilla({
      telefono: cita.paciente_id.telefono,
      nombrePlantilla: plantillaCancelacion(),
      parametrosNombrados: parametrosCita(cita),
      conBotones: false,
    });

    return true;
  } catch (error) {
    console.error(`No se pudo notificar la cancelación de la cita ${citaId}:`, error.message);
    return false;
  }
};