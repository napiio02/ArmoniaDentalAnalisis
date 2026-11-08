import test from "node:test";
import assert from "node:assert/strict";
import HistoriaClinicaModel from "../src/models/HistoriaClinicaModel.js";
import PacienteModel from "../src/models/PacienteModel.js";
import {
  crearHistoriaClinicaService,
  extraerCuestionario,
  normalizarEtiquetas,
  obtenerHistoriaClinicaPorPacienteService,
} from "../src/services/HistoriaClinicaService.js";

// Consulta falsa que soporta .select() y .lean()
const consulta = (valor) => ({ select: () => consulta(valor), lean: async () => valor });

test("alergias/enfermedades: sin vacíos ni repetidos y 'Ninguna' excluyente", () => {
  assert.equal(normalizarEtiquetas(undefined), undefined); // no viene: no se toca el paciente
  assert.deepEqual(normalizarEtiquetas([]), []);
  assert.deepEqual(normalizarEtiquetas([" Penicilina ", "penicilina", "", "Látex"]), ["Penicilina", "Látex"]);
  assert.deepEqual(normalizarEtiquetas(["Ninguna"]), ["Ninguna"]);
  assert.deepEqual(normalizarEtiquetas(["Ninguna", "Látex"]), ["Látex"]);
  assert.equal(normalizarEtiquetas(Array.from({ length: 50 }, (_, i) => `A${i}`)).length, 30);
});

test("cuestionario: solo se guardan campos de la historia clínica", () => {
  const limpio = extraerCuestionario({
    medicamentos: "Losartán",
    fumador: true,
    _id: "x",
    paciente_id: "otro",
    activo: false,
    createdAt: "2020-01-01",
    alergias: ["Látex"],
    campo_inventado: 1,
  });
  assert.deepEqual(limpio, { medicamentos: "Losartán", fumador: true });
});

test("guardar historia: alergias y enfermedades quedan en el paciente y la respuesta las incluye", async (t) => {
  const paciente = { _id: "p1", alergias: ["Anestesia"], enfermedades: [] };
  let historiaGuardada = null;
  const actualizacionesPaciente = [];

  t.mock.method(PacienteModel, "findById", () => consulta(paciente));
  t.mock.method(PacienteModel, "updateOne", async (filtro, cambios) => {
    actualizacionesPaciente.push(cambios.$set);
    Object.assign(paciente, cambios.$set);
    return { modifiedCount: 1 };
  });
  t.mock.method(HistoriaClinicaModel, "findOneAndUpdate", (filtro, cambios, opciones) => {
    assert.equal(opciones.upsert, true);
    historiaGuardada = { _id: "h1", paciente_id: filtro.paciente_id, ...(cambios.$set || {}) };
    return consulta(historiaGuardada);
  });

  const r = await crearHistoriaClinicaService("p1", {
    medicamentos: "Losartán",
    alergias: ["Penicilina", "penicilina", "Ninguna"],
    enfermedades: ["Hipertensión"],
    _id: "intento",
  });

  assert.deepEqual(actualizacionesPaciente, [{ alergias: ["Penicilina"], enfermedades: ["Hipertensión"] }]);
  assert.equal(historiaGuardada.medicamentos, "Losartán");
  assert.equal("alergias" in historiaGuardada, false); // no se duplican en la historia
  assert.equal(historiaGuardada._id, "h1"); // el _id enviado por el cliente se ignora
  assert.deepEqual(r.alergias, ["Penicilina"]);
  assert.deepEqual(r.enfermedades, ["Hipertensión"]);
});

test("guardar historia sin alergias/enfermedades en la petición no borra las del paciente", async (t) => {
  const paciente = { _id: "p1", alergias: ["Látex"], enfermedades: ["Asma"] };
  const updateOne = t.mock.method(PacienteModel, "updateOne", async () => ({}));
  t.mock.method(PacienteModel, "findById", () => consulta(paciente));
  t.mock.method(HistoriaClinicaModel, "findOneAndUpdate", () => consulta({ _id: "h1", fumador: true }));

  const r = await crearHistoriaClinicaService("p1", { fumador: true });
  assert.equal(updateOne.mock.callCount(), 0);
  assert.deepEqual(r.alergias, ["Látex"]);
});

test("guardar historia de un paciente inexistente: 404", async (t) => {
  t.mock.method(PacienteModel, "findById", () => consulta(null));
  await assert.rejects(crearHistoriaClinicaService("nadie", {}), (e) => e.status === 404);
});

test("consultar historia: incluye las alergias del paciente; sin historia devuelve null", async (t) => {
  t.mock.method(PacienteModel, "findById", () => consulta({ alergias: ["Látex"], enfermedades: ["Asma"] }));
  const findOne = t.mock.method(HistoriaClinicaModel, "findOne", () => consulta({ _id: "h1", medicamentos: "" }));
  assert.deepEqual((await obtenerHistoriaClinicaPorPacienteService("p1")).alergias, ["Látex"]);
  findOne.mock.mockImplementation(() => consulta(null));
  assert.equal(await obtenerHistoriaClinicaPorPacienteService("p1"), null);
});
