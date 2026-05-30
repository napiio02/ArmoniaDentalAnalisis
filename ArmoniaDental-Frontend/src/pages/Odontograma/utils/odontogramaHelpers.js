import {
	ALL_NUMS,
	CONTEXT_ACTIONS,
	SUP_DER,
	SUP_IZQ,
	INF_IZQ,
	INF_DER,
	TEMP_SD,
	TEMP_SI,
	TEMP_II,
	TEMP_ID,
} from "../data/odontogramaConstants";

export function blankTooth() {
	return {
		marks: [],
		observacion: "",
		// Historial confirmado que viene de BD.
		// No se debe llenar automáticamente mientras se edita.
		historial: [],
	};
}

export function buildBlankTeeth() {
	return Object.fromEntries(ALL_NUMS.map((n) => [n, blankTooth()]));
}

export function getActionById(id) {
	for (const group of CONTEXT_ACTIONS) {
		const match = group.items.find((item) => item.id === id);
		if (match) return match;
	}

	return null;
}

export function getType(num) {
	const d = num % 10 === 0 ? 10 : num % 10;

	if (d === 8 || d === 7) return "molar3";
	if (d === 6) return "molar";
	if (d === 5 || d === 4) return "premolar";
	if (d === 3) return "canino";

	return "incisivo";
}

export function normalizeText(value = "") {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim();
}

export function getTopLabels(marks = []) {
	const seen = new Set();

	return marks
		.map((mark) => getActionById(mark.actionId))
		.filter(Boolean)
		.filter((action) => ["label", "whole"].includes(action.type))
		.filter((action) => {
			if (seen.has(action.id)) return false;

			seen.add(action.id);
			return true;
		})
		.map((action) => ({
			text: action.shortLabel,
			color: action.color,
		}))
		.slice(0, 3);
}

export function getFaceColor(marks = [], face) {
	const mark = marks.find((m) => m.area === face);

	if (!mark) return null;

	const action = getActionById(mark.actionId);

	return action?.color || null;
}

export function getWholeAction(marks = [], ids = []) {
	const found = marks.find((mark) => ids.includes(mark.actionId));

	return found ? getActionById(found.actionId) : null;
}

export function formatNow() {
	const d = new Date();

	return d.toLocaleString("es-CR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatISODate() {
	return new Date().toISOString();
}

export function getExclusiveGroup(actionId) {
	if (
		[
			"ausente",
			"implante",
			"resto_radicular",
			"indicada_exodoncia",
		].includes(actionId)
	) {
		return "estado_estructural";
	}

	if (
		[
			"corona_metal_porcelana",
			"corona_libre_metal",
			"corona_acero_cromado",
		].includes(actionId)
	) {
		return "coronas";
	}

	return null;
}

export function markEquals(a, b) {
	return a.actionId === b.actionId && a.area === b.area;
}

/* =========================================================
   PACIENTES
========================================================= */

export function buildPatientOptions(pacientes = []) {
	return pacientes
		.filter((p) => p?.activo)
		.map((p) => ({
			_id: p._id,
			nombre: p.nombre,
			activo: p.activo,
			expediente_id: p.expediente_id || "",
			cedula: p.cedula || "",
			correo: p.correo || "",
			telefono: p.telefono || "",
		}));
}

/* =========================================================
   EVENTOS PENDIENTES DEL ODONTOGRAMA
   Estos eventos NO son historial definitivo.
   Solo se guardan en Mongo cuando la dentista confirma
   con el botón "Guardar odontograma".
========================================================= */

export function buildPendingEvent({
	toothNumber,
	tipoEvento = "Actualización",
	actionId = "",
	area = "",
	detalle = "",
	observacion = "",
}) {
	const action = actionId ? getActionById(actionId) : null;

	return {
		id_temporal: crypto.randomUUID(),
		pieza_numero: Number(toothNumber),
		tipo_evento: tipoEvento,
		accion_codigo: actionId,
		accion_nombre: action?.label || "",
		area: area || "",
		detalle,
		observacion,
		fecha_evento: formatISODate(),
		fecha_visual: formatNow(),
	};
}

export function buildRegisterEvent(toothNumber, actionId, area = "") {
	const action = getActionById(actionId);

	return buildPendingEvent({
		toothNumber,
		tipoEvento: "Registro",
		actionId,
		area,
		detalle: action
			? `${action.label} registrado${area ? ` en cara ${area}` : " en la pieza"}.`
			: "Registro agregado en la pieza.",
	});
}

export function buildRemoveEvent(toothNumber, markToRemove) {
	const action = getActionById(markToRemove.actionId);
	const area = markToRemove.area || "";

	return buildPendingEvent({
		toothNumber,
		tipoEvento: "Actualización",
		actionId: markToRemove.actionId,
		area,
		detalle: action
			? `Se eliminó ${action.label}${
					["V", "L", "M", "D", "O"].includes(area)
						? ` de la cara ${area}`
						: " de la pieza"
			  }.`
			: "Se eliminó un registro de la pieza.",
	});
}

export function buildClearToothEvent(toothNumber) {
	return buildPendingEvent({
		toothNumber,
		tipoEvento: "Actualización",
		actionId: "",
		area: "pieza",
		detalle: "Se limpió el registro completo de la pieza.",
	});
}

export function buildObservationEvent(toothNumber, value) {
	return buildPendingEvent({
		toothNumber,
		tipoEvento: "Observación",
		actionId: "",
		area: "pieza",
		detalle: value?.trim()
			? "Se actualizó la observación clínica de la pieza."
			: "Se eliminó la observación clínica de la pieza.",
		observacion: value || "",
	});
}

/* =========================================================
   FUNCIÓN ANTIGUA
   Se deja solo por compatibilidad temporal.
   La idea es dejar de usarla en Odontograma.jsx.
========================================================= */

export function addHistoryEntry(currentTooth, tipo, detalle) {
	return {
		...currentTooth,
		historial: [
			{
				fecha: formatNow(),
				tipo,
				detalle,
			},
			...(currentTooth?.historial || []),
		],
	};
}

/* =========================================================
   PAYLOAD PARA BACKEND
   Solo manda piezas permanentes o temporales según dentadura.
========================================================= */

export function buildOdontogramaPayload({
	pacienteId,
	expedienteId,
	dentadura,
	teeth,
	notasGenerales,
	pendingEvents,
}) {
	const numerosPiezas =
		dentadura === "temporal"
			? [...TEMP_SD, ...TEMP_SI, ...TEMP_II, ...TEMP_ID]
			: [...SUP_DER, ...SUP_IZQ, ...INF_IZQ, ...INF_DER];

	return {
		paciente_id: pacienteId,
		expediente_id: expedienteId,
		dentadura,
		piezas: numerosPiezas.map((numero) => {
			const data = teeth[numero] || {};

			return {
				numero: Number(numero),
				marks: data.marks || [],
				observacion: data.observacion || "",
			};
		}),
		notas_generales: notasGenerales || "",
		eventos: pendingEvents || [],
	};
}