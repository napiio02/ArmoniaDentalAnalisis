import CitaModel from "../models/CitaModel.js";
import { enviarMensajePlantilla } from "./WhatsappService.js";
import { obtenerConfiguracionAgenda } from "./ConfiguracionAgendaService.js";
import { ZONA_HORARIA, enSilencio, recordatoriosPendientes } from "../utils/AgendaUtils.js";

const DIA_MS = 24 * 60 * 60 * 1000;
const ESTADOS_ACTIVOS = ["Programada", "Confirmada"];

// Nombres de plantillas aprobadas en Meta (configurables por variable de entorno)
const plantillaRecordatorio = () =>
  process.env.WHATSAPP_PLANTILLA_RECORDATORIO || "recordatorio_cita";
const plantillaCancelacion = () =>
  process.env.WHATSAPP_PLANTILLA_CANCELACION || "cita_cancelada";

// Banderas de cada tipo de recordatorio en la cita
const CAMPOS = {
  vispera: "recordatorioVisperaEnviado",
  manana: "recordatorioMananaEnviado",
};

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

/* ───────── Recordatorios: víspera (4 p. m. del día laboral anterior) y mañana (7 a. m., solo sin confirmar) ───────── */

/*
 * Reclama el envío de forma atómica (marca la bandera antes de enviar) para que
 * dos ejecuciones simultáneas del job no manden el mismo mensaje dos veces.
 * Si el envío falla, se libera la bandera para reintentar en la próxima corrida.
 * El de la mañana solo se envía si la cita sigue "Programada" (sin confirmar).
 */
const enviarRecordatorio = async (cita, tipo) => {
  const campo = CAMPOS[tipo];
  const reclamada = await CitaModel.findOneAndUpdate(
    {
      _id: cita._id,
      estado: tipo === "manana" ? "Programada" : { $in: ESTADOS_ACTIVOS },
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

/*
 * Se ejecuta cada pocos minutos. Para cada cita próxima calcula qué recordatorio
 * le toca ahora según el horario de atención (días no laborables incluidos).
 * Interruptor para pruebas: RECORDATORIOS_ACTIVOS=false apaga todos los recordatorios.
 */
export const enviarRecordatoriosPendientes = async () => {
  const vacio = () => ({ encontradas: 0, enviados: 0, fallidos: 0 });
  const resultado = { activo: true, silencio: false, vispera: vacio(), manana: vacio() };

  if (String(process.env.RECORDATORIOS_ACTIVOS ?? "true").toLowerCase() === "false") {
    return { ...resultado, activo: false };
  }

  const ahora = new Date();
  if (enSilencio(ahora)) return { ...resultado, silencio: true };

  const config = await obtenerConfiguracionAgenda();

  const citas = await CitaModel.find({
    estado: { $in: ESTADOS_ACTIVOS },
    fecha_hora: { $gt: ahora, $lte: new Date(ahora.getTime() + 10 * DIA_MS) },
  })
    .populate("paciente_id", "nombre telefono")
    .lean();

  // Una cita = un mensaje de cada tipo. Un paciente con varias citas recibe un recordatorio por cada una.
  for (const cita of citas) {
    for (const tipo of recordatoriosPendientes(cita, config, ahora)) {
      resultado[tipo].encontradas++;

      if (!cita.paciente_id?.telefono) {
        console.warn(`Cita ${cita._id}: el paciente no tiene teléfono registrado.`);
        resultado[tipo].fallidos++;
        continue;
      }

      (await enviarRecordatorio(cita, tipo)) ? resultado[tipo].enviados++ : resultado[tipo].fallidos++;
    }
  }

  return resultado;
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
