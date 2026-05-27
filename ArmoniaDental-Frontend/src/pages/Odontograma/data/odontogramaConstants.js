/* =========================================================
   Numeración según la Federación Internacional de la Salud
========================================================= */

export const SUP_DER = [18, 17, 16, 15, 14, 13, 12, 11];
export const SUP_IZQ = [21, 22, 23, 24, 25, 26, 27, 28];
export const INF_IZQ = [31, 32, 33, 34, 35, 36, 37, 38];
export const INF_DER = [41, 42, 43, 44, 45, 46, 47, 48];

export const TEMP_SD = [55, 54, 53, 52, 51];
export const TEMP_SI = [61, 62, 63, 64, 65];
export const TEMP_II = [71, 72, 73, 74, 75];
export const TEMP_ID = [81, 82, 83, 84, 85];

export const ALL_NUMS = [
	...SUP_DER,
	...SUP_IZQ,
	...INF_IZQ,
	...INF_DER,
	...TEMP_SD,
	...TEMP_SI,
	...TEMP_II,
	...TEMP_ID,
];

/* =========================================================
   Simbología Dental
========================================================= */

export const STATUS_COLORS = {
	verde: "#16a34a",
	azul: "#2563eb",
	rojo: "#dc2626",
	negro: "#111827",
};

export const CONTEXT_ACTIONS = [
	{
		group: "Hallazgos",
		items: [
			{
				id: "caries_cavitada",
				label: "Caries cavitada",
				color: STATUS_COLORS.rojo,
				shortLabel: "CAR",
				type: "shape",
			},
			{
				id: "fractura_coronal",
				label: "Fractura coronal",
				color: STATUS_COLORS.rojo,
				shortLabel: "FRC",
				type: "shape",
			},
			{
				id: "ausente",
				label: "Pieza ausente",
				color: STATUS_COLORS.negro,
				shortLabel: "AUS",
				type: "whole",
			},
			{
				id: "resto_radicular",
				label: "Resto radicular",
				color: STATUS_COLORS.rojo,
				shortLabel: "RR",
				type: "whole",
			},
			{
				id: "indicada_exodoncia",
				label: "Indicada para exodoncia",
				color: STATUS_COLORS.rojo,
				shortLabel: "EXO",
				type: "whole",
			},
			{
				id: "giroversion",
				label: "Giroversión",
				color: STATUS_COLORS.azul,
				shortLabel: "GIR",
				type: "label",
			},
			{
				id: "fusion",
				label: "Fusión",
				color: STATUS_COLORS.azul,
				shortLabel: "FUS",
				type: "label",
			},
		],
	},
	{
		group: "Restauraciones y tratamientos",
		items: [
			{
				id: "resina",
				label: "Resina",
				color: STATUS_COLORS.verde,
				shortLabel: "RES",
				type: "faces",
			},
			{
				id: "amalgama",
				label: "Amalgama",
				color: STATUS_COLORS.azul,
				shortLabel: "AMA",
				type: "faces",
			},
			{
				id: "material_temporal",
				label: "Material temporal",
				color: STATUS_COLORS.rojo,
				shortLabel: "TEMP",
				type: "faces",
			},
			{
				id: "sellante",
				label: "Sellante",
				color: STATUS_COLORS.verde,
				shortLabel: "S",
				type: "whole",
			},
			{
				id: "incrustacion",
				label: "Incrustación",
				color: STATUS_COLORS.azul,
				shortLabel: "INC",
				type: "faces",
			},
			{
				id: "endodoncia",
				label: "Endodoncia",
				color: STATUS_COLORS.azul,
				shortLabel: "ENDO",
				type: "whole",
			},
			{
				id: "implante",
				label: "Implante",
				color: STATUS_COLORS.negro,
				shortLabel: "IMP",
				type: "whole",
			},
			{
				id: "brackets",
				label: "Ortodoncia fija",
				color: STATUS_COLORS.negro,
				shortLabel: "ORTO",
				type: "label",
			},
		],
	},
	{
		group: "Coronas",
		items: [
			{
				id: "corona_metal_porcelana",
				label: "Corona metal porcelana",
				color: STATUS_COLORS.azul,
				shortLabel: "CMP",
				type: "whole",
			},
			{
				id: "corona_libre_metal",
				label: "Corona libre de metal",
				color: STATUS_COLORS.azul,
				shortLabel: "CLM",
				type: "whole",
			},
			{
				id: "corona_acero_cromado",
				label: "Corona de acero cromado",
				color: STATUS_COLORS.azul,
				shortLabel: "CAC",
				type: "whole",
			},
		],
	},
];

/* =========================================================
   Caras de las Piezas dentales
========================================================= */

export const CIRCLE_FACES = {
	V: "M3,3 L37,3 L27,13 L13,13 Z",
	L: "M13,27 L27,27 L37,37 L3,37 Z",
	M: "M3,3 L13,13 L13,27 L3,37 Z",
	D: "M27,13 L37,3 L37,37 L27,27 Z",
	O: "M13,13 L27,13 L27,27 L13,27 Z",
};

/* =========================================================
   Acciones Rápidas
========================================================= */

export const FACE_ACTION_IDS = [
	"resina",
	"amalgama",
	"material_temporal",
	"caries_cavitada",
	"fractura_coronal",
	"incrustacion",
];


export const MAIN_LEGEND = [
	{
		color: STATUS_COLORS.verde,
		text: "Resina y sellante",
	},
	{
		color: STATUS_COLORS.azul,
		text: "Amalgama, coronas y endodoncia",
	},
	{
		color: STATUS_COLORS.rojo,
		text: "Caries, material temporal, exodoncia y resto radicular",
	},
	{
		color: STATUS_COLORS.negro,
		text: "Ausente, implante y ortodoncia fija",
	},
];