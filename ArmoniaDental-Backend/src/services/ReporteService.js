import PacienteModel from "../models/PacienteModel.js";
import CitaModel from "../models/CitaModel.js";
import MarcaModel from "../models/MarcaModel.js";
import InsumoModel from "../models/InsumoModel.js";
import Usuario from "../models/Usuario.js";
import Rol from "../models/Roles.js";

const ZONA_HORARIA = "America/Costa_Rica";
const DESFASE_COSTA_RICA = "-06:00";
const ROLES_VISIBILIDAD_TOTAL = ["Admin", "Dentista"];
const SECCIONES = ["pacientes", "citas", "horas", "stockCritico"];

const crearError = (mensaje, statusCode = 400) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
};

const esFechaISOValida = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || "")) return false;

  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return fecha.getUTCFullYear() === anio
    && fecha.getUTCMonth() === mes - 1
    && fecha.getUTCDate() === dia;
};

const restarUnDia = (fechaISO) => {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  fecha.setUTCDate(fecha.getUTCDate() - 1);
  return fecha.toISOString().slice(0, 10);
};

export const normalizarPeriodoReporte = (desde, hasta) => {
  if (!esFechaISOValida(desde) || !esFechaISOValida(hasta)) {
    throw crearError("Debe indicar desde y hasta con el formato YYYY-MM-DD.");
  }

  if (desde >= hasta) {
    throw crearError("La fecha hasta debe ser posterior a la fecha desde.");
  }

  return {
    desde,
    hasta,
    fechaFinalInclusiva: restarUnDia(hasta),
    zonaHoraria: ZONA_HORARIA,
    desdeFecha: new Date(`${desde}T00:00:00${DESFASE_COSTA_RICA}`),
    hastaFecha: new Date(`${hasta}T00:00:00${DESFASE_COSTA_RICA}`),
  };
};

const obtenerPacientes = async ({ desdeFecha, hastaFecha }) => ({
  nuevos: await PacienteModel.countDocuments({
    createdAt: { $gte: desdeFecha, $lt: hastaFecha },
  }),
});

const obtenerCitas = async ({ desdeFecha, hastaFecha }) => {
  const [resultado = {}] = await CitaModel.aggregate([
    {
      $match: {
        fecha_hora: { $gte: desdeFecha, $lt: hastaFecha },
      },
    },
    {
      $facet: {
        resumen: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              canceladas: {
                $sum: { $cond: [{ $eq: ["$estado", "Cancelada"] }, 1, 0] },
              },
            },
          },
        ],
        tratamientos: [
          { $group: { _id: "$tipo", cantidad: { $sum: 1 } } },
          { $sort: { cantidad: -1, _id: 1 } },
          { $project: { _id: 0, tipo: "$_id", cantidad: 1 } },
        ],
        estados: [
          { $group: { _id: "$estado", cantidad: { $sum: 1 } } },
          { $sort: { cantidad: -1, _id: 1 } },
          { $project: { _id: 0, estado: "$_id", cantidad: 1 } },
        ],
      },
    },
  ]);

  return {
    total: resultado.resumen?.[0]?.total ?? 0,
    canceladas: resultado.resumen?.[0]?.canceladas ?? 0,
    tratamientos: resultado.tratamientos ?? [],
    estados: resultado.estados ?? [],
  };
};

const obtenerHoras = async ({ desde, hasta }, usuarioSolicitante) => {
  const match = { fecha: { $gte: desde, $lt: hasta } };

  if (!ROLES_VISIBILIDAD_TOTAL.includes(usuarioSolicitante.rol)) {
    match.usuario_id = usuarioSolicitante._id;
  }

  const porEmpleado = await MarcaModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$usuario_id",
        totalHoras: { $sum: { $ifNull: ["$horas_trabajadas", 0] } },
        fechasTrabajadas: { $addToSet: "$fecha" },
      },
    },
    {
      $lookup: {
        from: Usuario.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "usuario",
      },
    },
    { $unwind: "$usuario" },
    {
      $lookup: {
        from: Rol.collection.name,
        localField: "usuario.rol_id",
        foreignField: "_id",
        as: "rol",
      },
    },
    { $unwind: { path: "$rol", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        usuario_id: { $toString: "$_id" },
        nombre: "$usuario.nombre",
        rol: "$rol.nombre",
        totalHoras: { $round: ["$totalHoras", 2] },
        diasTrabajados: { $size: "$fechasTrabajadas" },
      },
    },
    { $sort: { totalHoras: -1, nombre: 1 } },
  ]);

  return { porEmpleado };
};

const obtenerStockCritico = async () => {
  const insumos = await InsumoModel.aggregate([
    {
      $match: {
        activo: true,
        $expr: { $lte: ["$stock_actual", "$stock_minimo"] },
      },
    },
    {
      $project: {
        nombre: 1,
        categoria: 1,
        stock_actual: 1,
        stock_minimo: 1,
        unidad: 1,
        proveedor: 1,
      },
    },
    { $sort: { stock_actual: 1, nombre: 1 } },
  ]);

  return { total: insumos.length, insumos };
};

const mensajeErrorSeccion = {
  pacientes: "No se pudieron cargar los pacientes del período.",
  citas: "No se pudieron cargar las citas del período.",
  horas: "No se pudieron cargar las horas trabajadas del período.",
  stockCritico: "No se pudo cargar el stock crítico actual.",
};

export const obtenerReporteService = async (usuarioSolicitante, { desde, hasta }) => {
  const periodo = normalizarPeriodoReporte(desde, hasta);
  const resultados = await Promise.allSettled([
    obtenerPacientes(periodo),
    obtenerCitas(periodo),
    obtenerHoras(periodo, usuarioSolicitante),
    obtenerStockCritico(),
  ]);

  const errores = {};
  const data = {};

  resultados.forEach((resultado, indice) => {
    const seccion = SECCIONES[indice];

    if (resultado.status === "fulfilled") {
      data[seccion] = resultado.value;
      return;
    }

    console.error(`Error al generar la sección ${seccion} del reporte:`, resultado.reason);
    data[seccion] = null;
    errores[seccion] = mensajeErrorSeccion[seccion];
  });

  return {
    periodo: {
      desde: periodo.desde,
      hasta: periodo.hasta,
      fechaFinalInclusiva: periodo.fechaFinalInclusiva,
      zonaHoraria: periodo.zonaHoraria,
    },
    generadoEn: new Date().toISOString(),
    ...data,
    errores,
  };
};
