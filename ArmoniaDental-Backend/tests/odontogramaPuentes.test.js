import test from "node:test";
import assert from "node:assert/strict";
import { ACCIONES_ODONTOGRAMA, PIEZAS_POR_DENTADURA } from "../src/services/Odontograma/OdontogramaCatalogo.js";
import { generarEventosHistorial, validarPiezas } from "../src/services/Odontograma/OdontogramaService.js";

const catalogo = new Map(ACCIONES_ODONTOGRAMA.map((accion) => [accion.codigo, accion]));
const piezas = () => PIEZAS_POR_DENTADURA.permanente.map((numero) => ({ numero, marks: [], observacion: "" }));
const en = (lista, numero) => lista.find((p) => p.numero === numero);

test("catálogo: incluye poste, pilar de puente y póntico como acciones de pieza completa", () => {
  for (const codigo of ["poste", "pilar_puente", "pontico"]) {
    assert.equal(catalogo.get(codigo)?.tipo_render, "whole", codigo);
  }
  assert.equal(catalogo.get("pontico").grupo_exclusivo, "estado_estructural");
});

test("puente de 3 piezas (pilar - póntico - pilar) con endodoncia, poste y corona en un pilar", () => {
  const lista = piezas();
  en(lista, 14).marks = [{ actionId: "pilar_puente", area: "whole" }, { actionId: "endodoncia", area: "whole" },
    { actionId: "poste", area: "whole" }, { actionId: "corona_metal_porcelana", area: "whole" }];
  en(lista, 15).marks = [{ actionId: "pontico", area: "whole" }];
  en(lista, 16).marks = [{ actionId: "pilar_puente", area: "whole" }];
  assert.equal(validarPiezas(lista, "permanente", catalogo).length, 32);
});

test("póntico no puede convivir con pieza ausente, implante ni resto radicular", () => {
  for (const otro of ["ausente", "implante", "resto_radicular"]) {
    const lista = piezas();
    en(lista, 15).marks = [{ actionId: "pontico", area: "whole" }, { actionId: otro, area: "whole" }];
    assert.throws(() => validarPiezas(lista, "permanente", catalogo), /incompatibles/, otro);
  }
});

test("poste y puente deben marcarse en la pieza completa, no en una cara", () => {
  const lista = piezas();
  en(lista, 21).marks = [{ actionId: "poste", area: "V" }];
  assert.throws(() => validarPiezas(lista, "permanente", catalogo), /pieza completa/);
});

test("el historial registra el poste y el puente con su nombre", () => {
  const eventos = generarEventosHistorial({
    anteriores: [],
    nuevas: [{ numero: 15, marks: [{ actionId: "pontico", area: "whole" }], observacion: "" },
      { numero: 14, marks: [{ actionId: "poste", area: "whole" }], observacion: "" }],
    catalogo,
  });
  const texto = JSON.stringify(eventos);
  assert.match(texto, /Póntico/);
  assert.match(texto, /Poste intrarradicular/);
});
