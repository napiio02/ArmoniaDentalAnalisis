import test from "node:test";
import assert from "node:assert/strict";
import OdontogramaModel from "../src/models/Odontograma/OdontogramaModel.js";
import { ACCIONES_ODONTOGRAMA, PIEZAS_POR_DENTADURA } from "../src/services/Odontograma/OdontogramaCatalogo.js";
import { generarEventosHistorial, validarPiezas } from "../src/services/Odontograma/OdontogramaService.js";

const catalogo = new Map(ACCIONES_ODONTOGRAMA.map((accion) => [accion.codigo, accion]));
const piezasVacias = (dentadura) => PIEZAS_POR_DENTADURA[dentadura].map((numero) => ({
  numero,
  marks: [],
  observacion: "",
}));

test("odontogramas separa ambas denticiones en su índice único y usa concurrencia optimista", () => {
  const indice = OdontogramaModel.schema.indexes().find(([campos]) => campos.dentadura === 1);
  assert.deepEqual(indice[0], { paciente_id: 1, expediente_id: 1, dentadura: 1, activo: 1 });
  assert.equal(indice[1].unique, true);
  assert.equal(OdontogramaModel.schema.options.optimisticConcurrency, true);
});

test("valida número, acción, área, duplicados y grupos exclusivos en el servidor", () => {
  const validas = piezasVacias("permanente");
  validas[0].marks = [{ actionId: "resina", area: "V" }];
  assert.equal(validarPiezas(validas, "permanente", catalogo).length, 32);

  const piezaInvalida = piezasVacias("permanente");
  piezaInvalida[0].numero = 55;
  assert.throws(() => validarPiezas(piezaInvalida, "permanente", catalogo), /no pertenece/);

  const accionInvalida = piezasVacias("temporal");
  accionInvalida[0].marks = [{ actionId: "inventada", area: "V" }];
  assert.throws(() => validarPiezas(accionInvalida, "temporal", catalogo), /no existe o está inactiva/);

  const areaInvalida = piezasVacias("temporal");
  areaInvalida[0].marks = [{ actionId: "resina", area: "whole" }];
  assert.throws(() => validarPiezas(areaInvalida, "temporal", catalogo), /cara dental válida/);

  const duplicada = piezasVacias("temporal");
  duplicada[0].marks = [
    { actionId: "resina", area: "V" },
    { actionId: "resina", area: "V" },
  ];
  assert.throws(() => validarPiezas(duplicada, "temporal", catalogo), /duplicada/);

  const incompatibles = piezasVacias("temporal");
  incompatibles[0].marks = [
    { actionId: "ausente", area: "whole" },
    { actionId: "implante", area: "whole" },
  ];
  assert.throws(() => validarPiezas(incompatibles, "temporal", catalogo), /estados incompatibles/);
});

test("el historial se deriva de la diferencia real y cubre altas, bajas y observaciones", () => {
  const anteriores = [{
    numero: 18,
    marks: [{ actionId: "amalgama", area: "O" }],
    observacion: "Anterior",
  }];
  const nuevas = [{
    numero: 18,
    marks: [{ actionId: "resina", area: "O" }],
    observacion: "Nueva",
  }];
  const eventos = generarEventosHistorial({
    anteriores,
    nuevas,
    notasAnteriores: "Nota anterior",
    notasNuevas: "Nota nueva",
    catalogo,
  });

  assert.deepEqual(eventos.map((evento) => evento.tipo_evento), [
    "Actualización",
    "Registro",
    "Observación",
    "Observación",
  ]);
  assert.match(eventos[0].detalle, /Se eliminó Amalgama/);
  assert.match(eventos[1].detalle, /Resina registrado/);
  assert.equal(eventos[2].pieza_numero, 18);
  assert.equal(eventos[3].ambito, "general");
  assert.equal(eventos[3].pieza_numero, null);
});
