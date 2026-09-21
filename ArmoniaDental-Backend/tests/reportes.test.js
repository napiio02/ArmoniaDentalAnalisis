import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import PacienteModel from "../src/models/PacienteModel.js";
import CitaModel from "../src/models/CitaModel.js";
import MarcaModel from "../src/models/MarcaModel.js";
import InsumoModel from "../src/models/InsumoModel.js";
import {
  normalizarPeriodoReporte,
  obtenerReporteService,
} from "../src/services/ReporteService.js";

test("Reportes usa un período común y conserva errores por sección", async (t) => {
  await t.test("convierte los límites de Costa Rica y usa una fecha final exclusiva", () => {
    const periodo = normalizarPeriodoReporte("2026-09-01", "2026-10-01");

    assert.equal(periodo.desdeFecha.toISOString(), "2026-09-01T06:00:00.000Z");
    assert.equal(periodo.hastaFecha.toISOString(), "2026-10-01T06:00:00.000Z");
    assert.equal(periodo.fechaFinalInclusiva, "2026-09-30");
    assert.equal(periodo.zonaHoraria, "America/Costa_Rica");
    assert.throws(
      () => normalizarPeriodoReporte("2026-09-30", "2026-09-01"),
      /fecha hasta debe ser posterior/,
    );
    assert.throws(
      () => normalizarPeriodoReporte("2026-02-30", "2026-03-02"),
      /formato YYYY-MM-DD/,
    );
  });

  await t.test("envía el mismo rango a pacientes, citas y marcas y cuenta fechas únicas", async () => {
    const originales = {
      pacientes: PacienteModel.countDocuments,
      citas: CitaModel.aggregate,
      marcas: MarcaModel.aggregate,
      insumos: InsumoModel.aggregate,
    };
    t.after(() => {
      PacienteModel.countDocuments = originales.pacientes;
      CitaModel.aggregate = originales.citas;
      MarcaModel.aggregate = originales.marcas;
      InsumoModel.aggregate = originales.insumos;
    });

    let filtroPacientes;
    let pipelineCitas;
    let pipelineMarcas;
    PacienteModel.countDocuments = async (filtro) => {
      filtroPacientes = filtro;
      return 4;
    };
    CitaModel.aggregate = async (pipeline) => {
      pipelineCitas = pipeline;
      return [{
        resumen: [{ total: 3, canceladas: 1 }],
        tratamientos: [{ tipo: "Limpieza", cantidad: 2 }],
        estados: [{ estado: "Atendida", cantidad: 2 }],
      }];
    };
    MarcaModel.aggregate = async (pipeline) => {
      pipelineMarcas = pipeline;
      return [{ usuario_id: "empleado", nombre: "Empleado", totalHoras: 8, diasTrabajados: 1 }];
    };
    InsumoModel.aggregate = async () => [{ _id: new mongoose.Types.ObjectId(), nombre: "Guantes" }];

    const reporte = await obtenerReporteService(
      { _id: new mongoose.Types.ObjectId(), rol: "Asistente Dental" },
      { desde: "2026-09-01", hasta: "2026-10-01" },
    );

    assert.equal(filtroPacientes.createdAt.$gte.toISOString(), "2026-09-01T06:00:00.000Z");
    assert.equal(filtroPacientes.createdAt.$lt.toISOString(), "2026-10-01T06:00:00.000Z");
    assert.equal(pipelineCitas[0].$match.fecha_hora.$gte.toISOString(), "2026-09-01T06:00:00.000Z");
    assert.equal(pipelineCitas[0].$match.fecha_hora.$lt.toISOString(), "2026-10-01T06:00:00.000Z");
    assert.deepEqual(pipelineMarcas[0].$match.fecha, { $gte: "2026-09-01", $lt: "2026-10-01" });
    assert.ok(pipelineMarcas[0].$match.usuario_id);
    assert.deepEqual(pipelineMarcas[1].$group.fechasTrabajadas, { $addToSet: "$fecha" });
    assert.deepEqual(pipelineMarcas[6].$project.diasTrabajados, { $size: "$fechasTrabajadas" });
    assert.equal(reporte.pacientes.nuevos, 4);
    assert.equal(reporte.citas.total, 3);
    assert.equal(reporte.stockCritico.total, 1);
    assert.deepEqual(reporte.errores, {});
  });

  await t.test("una sección fallida se identifica y no se convierte en cero", async () => {
    const originales = {
      pacientes: PacienteModel.countDocuments,
      citas: CitaModel.aggregate,
      marcas: MarcaModel.aggregate,
      insumos: InsumoModel.aggregate,
      error: console.error,
    };
    t.after(() => {
      PacienteModel.countDocuments = originales.pacientes;
      CitaModel.aggregate = originales.citas;
      MarcaModel.aggregate = originales.marcas;
      InsumoModel.aggregate = originales.insumos;
      console.error = originales.error;
    });

    console.error = () => {};
    PacienteModel.countDocuments = async () => 1;
    CitaModel.aggregate = async () => { throw new Error("Mongo no disponible"); };
    MarcaModel.aggregate = async () => [];
    InsumoModel.aggregate = async () => [];

    const reporte = await obtenerReporteService(
      { _id: new mongoose.Types.ObjectId(), rol: "Admin" },
      { desde: "2026-01-01", hasta: "2027-01-01" },
    );

    assert.equal(reporte.citas, null);
    assert.match(reporte.errores.citas, /No se pudieron cargar/);
    assert.deepEqual(reporte.horas, { porEmpleado: [] });
  });
});
