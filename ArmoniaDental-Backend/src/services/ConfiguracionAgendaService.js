import CitaModel from "../models/CitaModel.js";
import ConfiguracionAgendaModel from "../models/ConfiguracionAgendaModel.js";
import {
  CONFIG_POR_DEFECTO,
  duracionCita,
  fechaCR,
  normalizarConfiguracion,
  textoFechaLarga,
  validarHorarioCita,
} from "../utils/AgendaUtils.js";

const ESTADOS_ACTIVOS = ["Programada", "Confirmada"];

const aConfiguracion = (doc) => ({
  horaInicio: doc?.horaInicio ?? CONFIG_POR_DEFECTO.horaInicio,
  horaFin: doc?.horaFin ?? CONFIG_POR_DEFECTO.horaFin,
  diasNoLaborables: doc?.diasNoLaborables ?? [...CONFIG_POR_DEFECTO.diasNoLaborables],
  fechasNoLaborables: (doc?.fechasNoLaborables ?? []).map(({ fecha, motivo }) => ({
    fecha,
    motivo: motivo || "",
  })),
});

// Si todavía no existe la configuración, se crea con los valores por defecto (lunes a sábado, 9 a. m. a 6 p. m.)
export const obtenerConfiguracionAgenda = async () => {
  const doc = await ConfiguracionAgendaModel.findOneAndUpdate(
    { clave: "principal" },
    { $setOnInsert: { clave: "principal" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return aConfiguracion(doc);
};

// Citas futuras que quedan en un día u horario sin atención con la nueva configuración
const citasAfectadasPorConfiguracion = async (config) => {
  const citas = await CitaModel.find({
    estado: { $in: ESTADOS_ACTIVOS },
    fecha_hora: { $gte: new Date() },
  })
    .populate("paciente_id", "nombre")
    .sort({ fecha_hora: 1 })
    .lean();

  const afectadas = citas.filter((c) => validarHorarioCita(c.fecha_hora, duracionCita(c.tipo), config));

  return {
    total: afectadas.length,
    ejemplos: afectadas.slice(0, 10).map((c) => ({
      _id: c._id,
      fecha: textoFechaLarga(fechaCR(c.fecha_hora)),
      fecha_hora: c.fecha_hora,
      tipo: c.tipo,
      paciente: c.paciente_id?.nombre ?? "Paciente",
    })),
  };
};

export const actualizarConfiguracionAgenda = async (datos) => {
  const actual = await obtenerConfiguracionAgenda();
  const nueva = normalizarConfiguracion(datos, actual);

  await ConfiguracionAgendaModel.updateOne(
    { clave: "principal" },
    { $set: nueva, $setOnInsert: { clave: "principal" } },
    { upsert: true, runValidators: true }
  );

  return {
    configuracion: await obtenerConfiguracionAgenda(),
    citasAfectadas: await citasAfectadasPorConfiguracion(nueva),
  };
};
