import { obtenerReporteService } from "../services/ReporteService.js";

export async function obtenerReporte(req, res) {
  try {
    const reporte = await obtenerReporteService(req.user, req.query);

    return res.status(200).json({
      ok: true,
      parcial: Object.keys(reporte.errores).length > 0,
      message: "Reporte obtenido correctamente.",
      data: reporte,
    });
  } catch (error) {
    console.error("Error al obtener el reporte:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.statusCode
        ? error.message
        : "Ocurrió un error al generar el reporte.",
      data: null,
    });
  }
}
