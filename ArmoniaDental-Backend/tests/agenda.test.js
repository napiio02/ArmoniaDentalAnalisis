import test from "node:test";
import assert from "node:assert/strict";
import {
  CONFIG_POR_DEFECTO,
  aFechaCR,
  calcularFlagsRecordatorio,
  enSilencio,
  esDiaLaboral,
  generarSlots,
  normalizarConfiguracion,
  programarRecordatorios,
  recordatoriosPendientes,
  validarHorarioCita,
} from "../src/utils/AgendaUtils.js";

// Octubre 2026: lunes 12, martes 13, miércoles 14, jueves 15, sábado 17, domingo 18
const config = (extra = {}) => ({ ...CONFIG_POR_DEFECTO, ...extra });
const cr = (iso, hhmm) => aFechaCR(iso, hhmm);

test("configuración: valida horario, días y fechas", () => {
  assert.deepEqual(normalizarConfiguracion({ horaInicio: "08:00", horaFin: "17:00" }).horaInicio, "08:00");
  assert.throws(() => normalizarConfiguracion({ horaInicio: "18:00", horaFin: "09:00" }), /posterior/);
  assert.throws(() => normalizarConfiguracion({ horaInicio: "09:00", horaFin: "09:15" }), /30 minutos/);
  assert.throws(() => normalizarConfiguracion({ horaInicio: "9am" }), /HH:MM/);
  assert.throws(() => normalizarConfiguracion({ diasNoLaborables: [0, 1, 2, 3, 4, 5, 6] }), /al menos un día/);
  assert.throws(() => normalizarConfiguracion({ diasNoLaborables: [9] }), /no son válidos/);
  assert.throws(() => normalizarConfiguracion({ fechasNoLaborables: [{ fecha: "2026-02-30" }] }), /no es válida/);

  const limpia = normalizarConfiguracion({
    diasNoLaborables: [6, 0, 0],
    fechasNoLaborables: [
      { fecha: "2026-12-25", motivo: "  Navidad " },
      { fecha: "2026-08-15", motivo: "Día de la Madre" },
      { fecha: "2026-12-25", motivo: "Navidad (repetida)" },
    ],
  });
  assert.deepEqual(limpia.diasNoLaborables, [0, 6]);
  assert.deepEqual(limpia.fechasNoLaborables.map((f) => f.fecha), ["2026-08-15", "2026-12-25"]);
  assert.equal(limpia.fechasNoLaborables[1].motivo, "Navidad (repetida)");
});

test("días laborables: domingo fijo y fechas específicas", () => {
  const c = config({ fechasNoLaborables: [{ fecha: "2026-10-14", motivo: "Capacitación" }] });
  assert.equal(esDiaLaboral("2026-10-12", c).laboral, true); // lunes
  assert.equal(esDiaLaboral("2026-10-17", c).laboral, true); // sábado
  const domingo = esDiaLaboral("2026-10-18", c);
  assert.equal(domingo.laboral, false);
  assert.match(domingo.motivo, /domingos/);
  assert.deepEqual(esDiaLaboral("2026-10-14", c), { laboral: false, motivo: "Capacitación" });
});

test("validar cita: horario de atención (9 a. m. a 6 p. m.) y duración", () => {
  const c = config();
  assert.equal(validarHorarioCita(cr("2026-10-12", "09:00"), 30, c), null);
  assert.equal(validarHorarioCita(cr("2026-10-12", "17:30"), 30, c), null); // termina justo a las 6:00 p. m.
  assert.match(validarHorarioCita(cr("2026-10-12", "08:30"), 30, c), /horario de atención.*9:00 a\. m\. a 6:00 p\. m\./);
  assert.match(validarHorarioCita(cr("2026-10-12", "17:45"), 30, c), /horario de atención/); // se pasa de las 6:00 p. m.
  assert.match(validarHorarioCita(cr("2026-10-12", "17:00"), 120, c), /horario de atención/); // cirugía no cabe
  assert.match(validarHorarioCita(cr("2026-10-18", "10:00"), 30, c), /domingo.*No se atiende los domingos/);
  // Una cita a las 7 p. m. hora de Costa Rica = 01:00 UTC del día siguiente: se valida en hora local
  assert.match(validarHorarioCita(cr("2026-10-12", "19:00"), 30, c), /horario de atención/);
});

test("horarios disponibles: según horario, duración y días sin atención", () => {
  const c = config();
  const ahora = cr("2026-10-01", "00:00");
  const limpieza = generarSlots({ fecha: "2026-10-12", duracionMin: 45, config: c, ahora });
  assert.equal(limpieza.length, 17); // 9:00 ... 17:00 (la de 17:30 terminaría 18:15)
  assert.equal(limpieza.at(-1).toISOString(), cr("2026-10-12", "17:00").toISOString());
  const cirugia = generarSlots({ fecha: "2026-10-12", duracionMin: 120, config: c, ahora });
  assert.equal(cirugia.at(-1).toISOString(), cr("2026-10-12", "16:00").toISOString());
  assert.deepEqual(generarSlots({ fecha: "2026-10-18", duracionMin: 30, config: c, ahora }), []); // domingo
  const temprano = generarSlots({ fecha: "2026-10-12", duracionMin: 30, config: config({ horaInicio: "07:00", horaFin: "12:00" }), ahora });
  assert.equal(temprano.length, 10); // cambiar el horario cambia los horarios ofrecidos
  // Horarios que ya pasaron hoy no se ofrecen
  const hoy = generarSlots({ fecha: "2026-10-12", duracionMin: 30, config: c, ahora: cr("2026-10-12", "15:00") });
  assert.equal(hoy[0].toISOString(), cr("2026-10-12", "15:00").toISOString());
});

test("recordatorios: víspera a las 4 p. m. del día laboral anterior", () => {
  const c = config();
  // Jueves 8 a. m.: víspera el miércoles; sin recordatorio de la mañana (la cita es antes de las 10)
  let p = programarRecordatorios(cr("2026-10-15", "08:00"), c);
  assert.equal(p.vispera.toISOString(), cr("2026-10-14", "16:00").toISOString());
  assert.equal(p.manana, null);
  // Jueves 2 p. m.: víspera el miércoles 4 p. m. y mañana el jueves 7 a. m. (nunca a las 2 a. m.)
  p = programarRecordatorios(cr("2026-10-15", "14:00"), c);
  assert.equal(p.vispera.toISOString(), cr("2026-10-14", "16:00").toISOString());
  assert.equal(p.manana.toISOString(), cr("2026-10-15", "07:00").toISOString());
  // Lunes: el domingo no se atiende, la víspera sale el sábado
  p = programarRecordatorios(cr("2026-10-12", "09:00"), c);
  assert.equal(p.vispera.toISOString(), cr("2026-10-10", "16:00").toISOString());
  // Día sin atención en medio (martes 13 cerrado): la cita del miércoles se recuerda el lunes
  p = programarRecordatorios(cr("2026-10-14", "11:00"), config({ fechasNoLaborables: [{ fecha: "2026-10-13", motivo: "Feriado" }] }));
  assert.equal(p.vispera.toISOString(), cr("2026-10-12", "16:00").toISOString());
});

test("recordatorios: al crear se omiten los que ya no tienen sentido", () => {
  const c = config();
  const cita = cr("2026-10-15", "14:00"); // víspera: miércoles 14 a las 4 p. m.; mañana: jueves 15 a las 7 a. m.
  // Creada con varios días de anticipación: ambos pendientes
  assert.deepEqual(calcularFlagsRecordatorio(cita, c, cr("2026-10-05", "10:00")),
    { recordatorioVisperaEnviado: false, recordatorioMananaEnviado: false });
  // Creada el miércoles al mediodía (4 h antes de la víspera): la víspera sí sale
  assert.equal(calcularFlagsRecordatorio(cita, c, cr("2026-10-14", "12:00")).recordatorioVisperaEnviado, false);
  // Creada el miércoles a las 3 p. m. (1 h antes): se omite, ya recibió la confirmación
  assert.equal(calcularFlagsRecordatorio(cita, c, cr("2026-10-14", "15:00")).recordatorioVisperaEnviado, true);
  // Creada el miércoles a las 5 p. m.: la víspera ya pasó; el de la mañana sí queda pendiente
  const tarde = calcularFlagsRecordatorio(cita, c, cr("2026-10-14", "17:00"));
  assert.deepEqual(tarde, { recordatorioVisperaEnviado: true, recordatorioMananaEnviado: false });
  // Cita antes de las 10: nunca lleva recordatorio de la mañana
  assert.equal(calcularFlagsRecordatorio(cr("2026-10-15", "09:00"), c, cr("2026-10-05", "10:00")).recordatorioMananaEnviado, true);
});

test("recordatorios: cuándo toca enviar cada uno", () => {
  const c = config();
  const base = { fecha_hora: cr("2026-10-15", "14:00"), estado: "Programada" };
  const cuando = (iso, hhmm, cita = base) => recordatoriosPendientes(cita, c, cr(iso, hhmm));

  assert.deepEqual(cuando("2026-10-14", "15:50"), []); // todavía no son las 4 p. m.
  assert.deepEqual(cuando("2026-10-14", "16:05"), ["vispera"]);
  assert.deepEqual(cuando("2026-10-14", "18:30"), ["vispera"]); // dentro de la gracia de 3 h
  assert.deepEqual(cuando("2026-10-14", "19:30"), []); // ya pasó la gracia: no se envía tarde
  assert.deepEqual(cuando("2026-10-14", "20:30"), []); // silencio nocturno
  assert.deepEqual(cuando("2026-10-15", "02:00"), []); // jamás a las 2 a. m.
  assert.deepEqual(cuando("2026-10-15", "07:10"), ["manana"]);
  assert.deepEqual(cuando("2026-10-15", "13:30"), []); // faltan menos de 1 h
  assert.deepEqual(cuando("2026-10-15", "15:00"), []); // la cita ya empezó

  // La de la mañana solo si no confirmó
  assert.deepEqual(cuando("2026-10-15", "07:10", { ...base, estado: "Confirmada" }), []);
  // La víspera sale aunque ya esté confirmada (es un recordatorio)
  assert.deepEqual(cuando("2026-10-14", "16:05", { ...base, estado: "Confirmada" }), ["vispera"]);
  // Ya enviados
  assert.deepEqual(cuando("2026-10-14", "16:05", { ...base, recordatorioVisperaEnviado: true }), []);
  assert.deepEqual(cuando("2026-10-15", "07:10", { ...base, recordatorioMananaEnviado: true }), []);
  // Banderas del esquema anterior (citas creadas antes del cambio) no generan mensajes duplicados
  assert.deepEqual(cuando("2026-10-14", "16:05", { ...base, recordatorio24Enviado: true }), []);
  assert.deepEqual(cuando("2026-10-15", "07:10", { ...base, recordatorio12Enviado: true }), []);
  // Cita temprana: solo la víspera
  const temprana = { fecha_hora: cr("2026-10-15", "09:00"), estado: "Programada" };
  assert.deepEqual(cuando("2026-10-15", "07:10", temprana), []);
  assert.deepEqual(cuando("2026-10-14", "16:05", temprana), ["vispera"]);
  // Lunes 9 a. m.: la víspera es el sábado a las 4 p. m., no el domingo
  const lunes = { fecha_hora: cr("2026-10-12", "09:00"), estado: "Programada" };
  assert.deepEqual(recordatoriosPendientes(lunes, c, cr("2026-10-10", "16:05")), ["vispera"]);
  assert.deepEqual(recordatoriosPendientes(lunes, c, cr("2026-10-11", "16:05")), []);
});

test("silencio nocturno: 8 p. m. a 7 a. m. hora de Costa Rica", () => {
  assert.equal(enSilencio(cr("2026-10-12", "06:59")), true);
  assert.equal(enSilencio(cr("2026-10-12", "07:00")), false);
  assert.equal(enSilencio(cr("2026-10-12", "19:59")), false);
  assert.equal(enSilencio(cr("2026-10-12", "20:00")), true);
  assert.equal(enSilencio(cr("2026-10-12", "00:30")), true);
});
