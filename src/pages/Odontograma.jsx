import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { PACIENTES } from "../data/mockData";
import {
	Save,
	RotateCcw,
	X,
	FileText,
	History,
	ClipboardList,
	Search,
	UserRound,
	Stethoscope,
	ShieldPlus,
} from "lucide-react";

/* =========================================================
   NUMERACIÓN FDI
========================================================= */
const SUP_DER = [18, 17, 16, 15, 14, 13, 12, 11];
const SUP_IZQ = [21, 22, 23, 24, 25, 26, 27, 28];
const INF_IZQ = [31, 32, 33, 34, 35, 36, 37, 38];
const INF_DER = [41, 42, 43, 44, 45, 46, 47, 48];

const TEMP_SD = [55, 54, 53, 52, 51];
const TEMP_SI = [61, 62, 63, 64, 65];
const TEMP_II = [71, 72, 73, 74, 75];
const TEMP_ID = [81, 82, 83, 84, 85];

const ALL_NUMS = [
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
   SIMBOLOGÍA
========================================================= */
const STATUS_COLORS = {
	verde: "#16a34a",
	azul: "#2563eb",
	rojo: "#dc2626",
	negro: "#111827",
};

const CONTEXT_ACTIONS = [
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
   MOCK PRECARGADO
========================================================= */
const PRELOADED_CASES = {
	p1: {
		18: {
			marks: [{ actionId: "ausente", area: "whole" }],
			observacion: "Pieza ausente desde control anterior.",
			historial: [
				{
					fecha: "2026-04-05",
					tipo: "Hallazgo",
					detalle: "Se registra pieza ausente.",
				},
			],
		},
		16: {
			marks: [{ actionId: "resina", area: "O" }],
			observacion: "Resina en cara oclusal en buen estado.",
			historial: [
				{
					fecha: "2026-03-11",
					tipo: "Tratamiento",
					detalle: "Resina oclusal.",
				},
			],
		},
		11: {
			marks: [{ actionId: "corona_libre_metal", area: "whole" }],
			observacion: "Corona estética vigente.",
			historial: [
				{
					fecha: "2026-02-02",
					tipo: "Tratamiento",
					detalle: "Colocación de corona libre de metal.",
				},
			],
		},
		26: {
			marks: [{ actionId: "endodoncia", area: "whole" }],
			observacion: "Pieza con endodoncia finalizada.",
			historial: [
				{
					fecha: "2026-01-24",
					tipo: "Tratamiento",
					detalle: "Endodoncia terminada.",
				},
			],
		},
		36: {
			marks: [{ actionId: "indicada_exodoncia", area: "whole" }],
			observacion: "Dolor persistente. Valorar extracción.",
			historial: [
				{
					fecha: "2026-04-10",
					tipo: "Hallazgo",
					detalle: "Pieza indicada para exodoncia.",
				},
			],
		},
		46: {
			marks: [{ actionId: "amalgama", area: "M" }],
			observacion: "Amalgama antigua en cara mesial.",
			historial: [
				{
					fecha: "2025-11-18",
					tipo: "Tratamiento",
					detalle: "Amalgama mesial.",
				},
			],
		},
	},
	p2: {
		55: {
			marks: [{ actionId: "material_temporal", area: "O" }],
			observacion: "Paciente pediátrico con material temporal.",
			historial: [
				{
					fecha: "2026-04-07",
					tipo: "Tratamiento",
					detalle: "Colocación de material temporal.",
				},
			],
		},
		64: {
			marks: [{ actionId: "sellante", area: "whole" }],
			observacion: "Sellante preventivo.",
			historial: [
				{
					fecha: "2026-02-21",
					tipo: "Tratamiento",
					detalle: "Sellante aplicado.",
				},
			],
		},
	},
};

const DEMO_PATIENTS = [
	{ _id: "p1", nombre: "Paciente demo permanente", activo: true },
	{ _id: "p2", nombre: "Paciente demo temporal", activo: true },
];

/* =========================================================
   HELPERS
========================================================= */
function getPatientMockId(pacienteId) {
	if (!pacienteId) return "p1";
	return pacienteId;
}

function blankTooth() {
	return {
		marks: [],
		observacion: "",
		historial: [],
	};
}

function buildBlankTeeth() {
	return Object.fromEntries(ALL_NUMS.map((n) => [n, blankTooth()]));
}

function getActionById(id) {
	for (const group of CONTEXT_ACTIONS) {
		const match = group.items.find((item) => item.id === id);
		if (match) return match;
	}
	return null;
}

function getType(num) {
	const d = num % 10 === 0 ? 10 : num % 10;
	if (d === 8 || d === 7) return "molar3";
	if (d === 6) return "molar";
	if (d === 5 || d === 4) return "premolar";
	if (d === 3) return "canino";
	return "incisivo";
}

function normalizeText(value = "") {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim();
}

function getTopLabels(marks) {
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

function getFaceColor(marks, face) {
	const mark = marks.find((m) => m.area === face);
	if (!mark) return null;
	const action = getActionById(mark.actionId);
	return action?.color || null;
}

function getWholeAction(marks, ids) {
	const found = marks.find((mark) => ids.includes(mark.actionId));
	return found ? getActionById(found.actionId) : null;
}

function formatNow() {
	const d = new Date();
	return d.toLocaleString("es-CR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getExclusiveGroup(actionId) {
	if (["ausente", "implante", "resto_radicular", "indicada_exodoncia"].includes(actionId)) {
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

function markEquals(a, b) {
	return a.actionId === b.actionId && a.area === b.area;
}

function addHistoryEntry(currentTooth, tipo, detalle) {
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

function buildPatientOptions() {
	const reales = (PACIENTES || [])
		.filter((p) => p?.activo)
		.map((p) => ({
			_id: p._id,
			nombre: p.nombre,
			activo: p.activo,
		}));

	const ids = new Set();
	const merged = [...DEMO_PATIENTS, ...reales].filter((p) => {
		if (!p?._id || ids.has(p._id)) return false;
		ids.add(p._id);
		return true;
	});

	return merged;
}

/* =========================================================
   SVG DEL DIENTE
========================================================= */
function ToothSVG({ num, upper, tooth, onContextMenu, onClick, small }) {
	const type = getType(num);
	const w = small ? 34 : 44;
	const h = small ? 72 : 90;
	const marks = tooth.marks || [];

	const ausente = getWholeAction(marks, ["ausente"]);
	const implante = getWholeAction(marks, ["implante"]);
	const endodoncia = getWholeAction(marks, ["endodoncia"]);
	const restoRadicular = getWholeAction(marks, ["resto_radicular"]);
	const exodoncia = getWholeAction(marks, ["indicada_exodoncia"]);
	const brackets = getWholeAction(marks, ["brackets"]);
	const sellante = getWholeAction(marks, ["sellante"]);

	const corona =
		getWholeAction(marks, [
			"corona_metal_porcelana",
			"corona_libre_metal",
			"corona_acero_cromado",
		]) || null;

	const fractureMarks = marks.filter((m) => m.actionId === "fractura_coronal");
	const gTransform = upper ? "scale(1)" : "translate(0,80) scale(1,-1)";

	const shapes = {
		molar3: {
			crown: "M7,40 Q6,22 9,16 L13,11 Q16,7 20,7 Q24,7 27,11 L31,16 Q34,22 33,40 Z",
			roots: [
				"M10,40 Q8,54 7,66 Q9,71 12,67 Q13,57 14,40",
				"M20,40 Q20,56 20,68 Q22,72 24,68 Q24,56 26,40",
				"M30,40 Q31,54 33,66 Q35,71 32,67 Q29,57 26,40",
			],
		},
		molar: {
			crown: "M8,40 Q7,24 10,18 L14,13 Q17,9 20,9 Q23,9 26,13 L30,18 Q33,24 32,40 Z",
			roots: [
				"M12,40 Q10,54 9,65 Q12,70 15,65 Q15,55 16,40",
				"M24,40 Q25,55 25,65 Q28,70 31,65 Q30,54 28,40",
			],
		},
		premolar: {
			crown: "M9,40 Q8,27 11,20 L15,14 Q17,10 20,10 Q23,10 25,14 L29,20 Q32,27 31,40 Z",
			roots: [
				"M14,40 Q13,54 12,66 Q15,71 18,66 Q18,55 18,40",
				"M22,40 Q22,55 22,66 Q25,71 28,66 Q27,54 26,40",
			],
		},
		canino: {
			crown: "M10,40 Q9,29 12,21 L16,13 Q18,8 20,8 Q22,8 24,13 L28,21 Q31,29 30,40 Z",
			roots: ["M18,40 Q17,55 16,68 Q18,74 20,74 Q22,74 24,68 Q23,55 22,40"],
		},
		incisivo: {
			crown: "M11,40 Q10,31 13,23 L17,16 Q18,12 20,12 Q22,12 23,16 L27,23 Q30,31 29,40 Z",
			roots: ["M18,40 Q17,53 16,65 Q18,71 20,71 Q22,71 24,65 Q23,53 22,40"],
		},
	};

	const sh = shapes[type] || shapes.incisivo;
	const mainStroke = corona?.color || "#9ca3af";
	const mainFill = corona ? "#eff6ff" : "#f3f4f6";

	return (
		<svg
			width={w}
			height={h}
			viewBox="0 0 40 80"
			onContextMenu={(e) => onContextMenu(e, num)}
			onClick={() => onClick(num)}
			className="cursor-pointer block select-none"
			style={{ overflow: "visible" }}
		>
			<g transform={gTransform}>
				{!ausente && !implante && (sh.roots || []).map((d, i) => (
					<path
						key={i}
						d={d}
						fill="none"
						stroke={
							endodoncia?.color ||
							restoRadicular?.color ||
							mainStroke
						}
						strokeWidth={endodoncia || restoRadicular ? 2.3 : 1.2}
						strokeLinecap="round"
					/>
				))}

				{implante && (
					<>
						<rect
							x="16"
							y="42"
							width="8"
							height="24"
							rx="2"
							fill="none"
							stroke={implante.color}
							strokeWidth="1.8"
						/>
						{[48, 54, 60].map((y) => (
							<line
								key={y}
								x1="16"
								y1={y}
								x2="24"
								y2={y}
								stroke={implante.color}
								strokeWidth="1"
							/>
						))}
					</>
				)}

				{!ausente && (
					<path
						d={sh.crown}
						fill={mainFill}
						stroke={mainStroke}
						strokeWidth={corona ? 2 : 1.2}
					/>
				)}

				{corona && (
					<rect
						x="10"
						y="19"
						width="20"
						height="16"
						fill="none"
						stroke={corona.color}
						strokeWidth="1.7"
						strokeDasharray="2 1"
					/>
				)}

				{sellante && !ausente && (
					<text
						x="20"
						y="24"
						textAnchor="middle"
						fontSize="10"
						fontWeight="bold"
						fill={sellante.color}
					>
						S
					</text>
				)}

				{ausente && (
					<>
						<line
							x1="10"
							y1="12"
							x2="30"
							y2="68"
							stroke={ausente.color}
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
						<line
							x1="30"
							y1="12"
							x2="10"
							y2="68"
							stroke={ausente.color}
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
					</>
				)}

				{exodoncia && (
					<line
						x1="8"
						y1="8"
						x2="31"
						y2="72"
						stroke={exodoncia.color}
						strokeWidth="2.2"
						strokeLinecap="round"
					/>
				)}

				{brackets && !ausente && (
					<>
						<rect
							x="13"
							y="27"
							width="14"
							height="8"
							rx="1.5"
							fill="none"
							stroke={brackets.color}
							strokeWidth="1.5"
						/>
						<line
							x1="20"
							y1="27"
							x2="20"
							y2="35"
							stroke={brackets.color}
							strokeWidth="1"
						/>
					</>
				)}

				{fractureMarks.length > 0 && (
					<path
						d="M13,18 L16,21 L14,24 L18,27 L16,31 L21,34"
						fill="none"
						stroke={STATUS_COLORS.rojo}
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				)}
			</g>
		</svg>
	);
}

/* =========================================================
   CÍRCULO DE CARAS
========================================================= */
const CIRCLE_FACES = {
	V: "M3,3 L37,3 L27,13 L13,13 Z",
	L: "M13,27 L27,27 L37,37 L3,37 Z",
	M: "M3,3 L13,13 L13,27 L3,37 Z",
	D: "M27,13 L37,3 L37,37 L27,27 Z",
	O: "M13,13 L27,13 L27,27 L13,27 Z",
};

function ObtCircle({ num, tooth, onFaceClick, small }) {
	const size = small ? 28 : 38;

	return (
		<svg width={size} height={size} viewBox="0 0 40 40" className="block">
			<defs>
				<clipPath id={`clip-${num}`}>
					<circle cx="20" cy="20" r="17" />
				</clipPath>
			</defs>

			<circle
				cx="20"
				cy="20"
				r="18"
				fill="#ffffff"
				stroke="#d1d5db"
				strokeWidth="1"
			/>

			{Object.entries(CIRCLE_FACES).map(([face, path]) => {
				const color = getFaceColor(tooth.marks, face);

				return (
					<path
						key={face}
						d={path}
						fill={color || "transparent"}
						stroke="#9ca3af"
						strokeWidth="0.6"
						clipPath={`url(#clip-${num})`}
						onClick={(e) => {
							e.stopPropagation();
							onFaceClick(num, face);
						}}
						className="cursor-pointer"
					/>
				);
			})}

			<circle
				cx="20"
				cy="20"
				r="18"
				fill="none"
				stroke="#6b7280"
				strokeWidth="1.3"
			/>
			<line x1="3" y1="3" x2="13" y2="13" stroke="#9ca3af" strokeWidth="0.6" />
			<line x1="37" y1="3" x2="27" y2="13" stroke="#9ca3af" strokeWidth="0.6" />
			<line x1="3" y1="37" x2="13" y2="27" stroke="#9ca3af" strokeWidth="0.6" />
			<line x1="37" y1="37" x2="27" y2="27" stroke="#9ca3af" strokeWidth="0.6" />
		</svg>
	);
}

/* =========================================================
   COLUMNA DE PIEZA
========================================================= */
function ToothCol({
	num,
	upper,
	tooth,
	onToothClick,
	onFaceClick,
	onContextMenu,
	small,
	isSelected,
}) {
	const labels = getTopLabels(tooth.marks);

	return (
		<div className="flex flex-col items-center" style={{ gap: 2 }}>
			<div className="h-5 flex items-center justify-center gap-1">
				{labels.length > 0 ? (
					labels.map((label, index) => (
						<span
							key={`${label.text}-${index}`}
							className="text-[8px] font-bold px-1 rounded border"
							style={{
								color: label.color,
								borderColor: `${label.color}55`,
								backgroundColor: `${label.color}12`,
							}}
						>
							{label.text}
						</span>
					))
				) : (
					<span className="text-[8px] text-gray-300">—</span>
				)}
			</div>

			{upper && (
				<div className={`rounded-md transition ${isSelected ? "ring-2 ring-sky-300" : ""}`}>
					<ToothSVG
						num={num}
						upper={true}
						tooth={tooth}
						onContextMenu={onContextMenu}
						onClick={onToothClick}
						small={small}
					/>
				</div>
			)}

			<ObtCircle
				num={num}
				tooth={tooth}
				onFaceClick={onFaceClick}
				small={small}
			/>

			{!upper && (
				<div className={`rounded-md transition ${isSelected ? "ring-2 ring-sky-300" : ""}`}>
					<ToothSVG
						num={num}
						upper={false}
						tooth={tooth}
						onContextMenu={onContextMenu}
						onClick={onToothClick}
						small={small}
					/>
				</div>
			)}

			<span
				className={`font-mono font-semibold ${small ? "text-[9px]" : "text-[10px]"} ${
					isSelected ? "text-sky-700" : "text-gray-500"
				}`}
			>
				{num}
			</span>
		</div>
	);
}

/* =========================================================
   BUSCADOR DE PACIENTES
========================================================= */
function PatientAutocomplete({
	options,
	selectedId,
	query,
	setQuery,
	onSelect,
}) {
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);

	const filtered = useMemo(() => {
		const term = normalizeText(query);
		if (!term) return options.slice(0, 8);

		return options
			.filter((p) => normalizeText(p.nombre).includes(term))
			.slice(0, 10);
	}, [options, query]);

	useEffect(() => {
		function handleClickOutside(event) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const selectedPatient = options.find((p) => p._id === selectedId);

	return (
		<div className="relative" ref={wrapperRef}>
			<div className="relative">
				<Search
					size={16}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
				/>
				<input
					type="text"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					placeholder="Buscar paciente por nombre..."
					className="input input-bordered w-full bg-white pl-10 pr-10"
				/>
				{query && (
					<button
						type="button"
						onClick={() => {
							setQuery("");
							setOpen(true);
						}}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
					>
						<X size={15} />
					</button>
				)}
			</div>

			{selectedPatient && (
				<div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
					<div className="flex items-center gap-2">
						<UserRound size={14} />
						<span className="font-medium">{selectedPatient.nombre}</span>
					</div>
				</div>
			)}

			{open && (
				<div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
					<div className="max-h-72 overflow-y-auto py-2">
						{filtered.length > 0 ? (
							filtered.map((patient) => (
								<button
									key={patient._id}
									type="button"
									onClick={() => {
										onSelect(patient);
										setOpen(false);
									}}
									className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-50 ${
										selectedId === patient._id ? "bg-sky-50" : ""
									}`}
								>
									<div className="rounded-full bg-gray-100 p-2 text-gray-500">
										<UserRound size={14} />
									</div>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-gray-800">
											{patient.nombre}
										</p>
										<p className="text-xs text-gray-400">
											ID: {patient._id}
										</p>
									</div>
								</button>
							))
						) : (
							<div className="px-3 py-4 text-sm text-gray-400">
								No se encontraron pacientes con ese nombre.
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

/* =========================================================
   MENÚ CONTEXTUAL
========================================================= */
function ContextMenu({ open, x, y, onClose, onSelectAction, onClearTooth }) {
	if (!open) return null;

	return (
		<>
			<div className="fixed inset-0 z-40" onClick={onClose} />

			<div
				className="fixed z-50 w-[330px] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
				style={{ left: x, top: y }}
			>
				<div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
					<p className="text-sm font-semibold text-gray-700">
						Registrar en pieza
					</p>
					<button
						onClick={onClose}
						className="btn btn-ghost btn-xs"
						type="button"
					>
						<X size={14} />
					</button>
				</div>

				<div className="max-h-[440px] overflow-y-auto">
					{CONTEXT_ACTIONS.map((group) => (
						<div key={group.group} className="p-3 border-b last:border-b-0">
							<p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
								{group.group}
							</p>

							<div className="grid grid-cols-1 gap-1.5">
								{group.items.map((item) => (
									<button
										key={item.id}
										type="button"
										onClick={() => onSelectAction(item)}
										className="flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-100 transition"
									>
										<span
											className="w-3 h-3 rounded-full border border-gray-300"
											style={{ backgroundColor: item.color }}
										/>
										<div className="flex flex-col">
											<span className="text-sm text-gray-700">
												{item.label}
											</span>
											<span className="text-[11px] text-gray-400">
												{item.type === "faces" || item.type === "shape"
													? "Aplicar sobre cara"
													: "Aplicar sobre pieza"}
											</span>
										</div>
									</button>
								))}
							</div>
						</div>
					))}
				</div>

				<div className="p-3 border-t bg-gray-50">
					<button
						type="button"
						onClick={onClearTooth}
						className="btn btn-outline btn-sm w-full"
					>
						Limpiar pieza completa
					</button>
				</div>
			</div>
		</>
	);
}

/* =========================================================
   MODAL OBSERVACIONES
========================================================= */
function ObservationModal({
	open,
	toothNumber,
	initialValue,
	onClose,
	onSave,
}) {
	const [value, setValue] = useState(initialValue || "");

	useEffect(() => {
		setValue(initialValue || "");
	}, [initialValue]);

	if (!open) return null;

	return (
		<>
			<div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
					<div className="px-5 py-4 border-b bg-gray-50">
						<p className="font-semibold text-gray-800">
							Observación clínica de la pieza {toothNumber}
						</p>
					</div>

					<div className="p-5">
						<textarea
							className="textarea textarea-bordered w-full h-36 text-sm"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="Escribe una observación clínica complementaria..."
						/>
					</div>

					<div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-2">
						<button className="btn btn-ghost" onClick={onClose}>
							Cancelar
						</button>
						<button
							className="btn btn-primary"
							onClick={() => onSave(value)}
						>
							Guardar observación
						</button>
					</div>
				</div>
			</div>
		</>
	);
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */
export default function Odontograma() {
	const [pacienteId, setPacienteId] = useState("");
	const [patientQuery, setPatientQuery] = useState("");
	const [dentadura, setDentadura] = useState("permanente");
	const [teeth, setTeeth] = useState(buildBlankTeeth());
	const [selectedTooth, setSelectedTooth] = useState(null);
	const [guardado, setGuardado] = useState(false);
	const [notasGenerales, setNotasGenerales] = useState("");

	const [contextMenu, setContextMenu] = useState({
		open: false,
		x: 0,
		y: 0,
		toothNumber: null,
	});

	const [faceActionId, setFaceActionId] = useState("resina");

	const [observationModal, setObservationModal] = useState({
		open: false,
		toothNumber: null,
	});

	const pageRef = useRef(null);

	const patientOptions = useMemo(() => buildPatientOptions(), []);
	const selectedPatient = useMemo(
		() => patientOptions.find((p) => p._id === pacienteId) || null,
		[pacienteId, patientOptions]
	);

	const selectedToothData = selectedTooth ? teeth[selectedTooth] : null;
	const isPerm = dentadura === "permanente";

	useEffect(() => {
		if (selectedPatient) {
			setPatientQuery(selectedPatient.nombre);
		}
	}, [selectedPatient]);

	useEffect(() => {
		const presetId = getPatientMockId(pacienteId);
		const base = buildBlankTeeth();
		const mock = PRELOADED_CASES[presetId] || PRELOADED_CASES.p1;

		Object.entries(mock).forEach(([toothNumber, data]) => {
			base[Number(toothNumber)] = {
				marks: data.marks || [],
				observacion: data.observacion || "",
				historial: data.historial || [],
			};
		});

		setTeeth(base);
		setSelectedTooth(null);

		if (presetId === "p2") {
			setDentadura("temporal");
		} else {
			setDentadura("permanente");
		}
	}, [pacienteId]);

	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === "Escape") {
				setContextMenu((prev) => ({ ...prev, open: false }));
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, []);

	const currentFaceAction = useMemo(
		() => getActionById(faceActionId),
		[faceActionId]
	);

	const selectedMarks = useMemo(() => {
		if (!selectedToothData?.marks?.length) return [];

		return selectedToothData.marks.map((mark, index) => {
			const action = getActionById(mark.actionId);
			return {
				...mark,
				index,
				action,
			};
		}).filter((item) => item.action);
	}, [selectedToothData]);

	const renderQuadrant = (nums, upper, small = false) => (
		<div className="flex items-end gap-0.5 justify-center">
			{nums.map((n) => (
				<ToothCol
					key={n}
					num={n}
					upper={upper}
					tooth={teeth[n]}
					onToothClick={handleToothClick}
					onFaceClick={handleFaceClick}
					onContextMenu={openContextMenu}
					small={small}
					isSelected={selectedTooth === n}
				/>
			))}
		</div>
	);

	function openContextMenu(event, toothNumber) {
		event.preventDefault();
		setSelectedTooth(toothNumber);

		const offsetX = window.innerWidth - event.clientX < 350 ? 350 : 0;
		const offsetY = window.innerHeight - event.clientY < 470 ? 440 : 0;

		setContextMenu({
			open: true,
			x: event.clientX - offsetX,
			y: event.clientY - offsetY,
			toothNumber,
		});
	}

	function handleToothClick(toothNumber) {
		setSelectedTooth(toothNumber);
	}

	function selectPatient(patient) {
		setPacienteId(patient._id);
		setPatientQuery(patient.nombre);
	}

	function handleFaceClick(toothNumber, face) {
		if (!faceActionId) return;

		const action = getActionById(faceActionId);
		if (!action) return;
		if (!["faces", "shape"].includes(action.type)) return;

		setSelectedTooth(toothNumber);

		setTeeth((prev) => {
			const current = prev[toothNumber];
			const existing = current.marks.find(
				(mark) => mark.area === face && mark.actionId === action.id
			);

			if (existing) {
				return prev;
			}

			const sameFaceIndex = current.marks.findIndex((mark) => mark.area === face);
			let newMarks = [...current.marks];

			if (sameFaceIndex >= 0) {
				newMarks.splice(sameFaceIndex, 1);
			}

			newMarks.push({ actionId: action.id, area: face });

			const updatedTooth = addHistoryEntry(
				{ ...current, marks: newMarks },
				"Registro",
				`${action.label} en cara ${face}.`
			);

			return {
				...prev,
				[toothNumber]: updatedTooth,
			};
		});
	}

	function handleSelectAction(action) {
		const toothNumber = contextMenu.toothNumber;
		if (!toothNumber) return;

		setSelectedTooth(toothNumber);

		if (["faces", "shape"].includes(action.type)) {
			setFaceActionId(action.id);
			setContextMenu((prev) => ({ ...prev, open: false }));
			return;
		}

		setTeeth((prev) => {
			const current = prev[toothNumber];
			const area = action.type === "label" ? "label" : "whole";
			const incomingMark = { actionId: action.id, area };

			const alreadyExists = current.marks.some((mark) => markEquals(mark, incomingMark));
			if (alreadyExists) {
				return prev;
			}

			let newMarks = [...current.marks];
			const exclusiveGroup = getExclusiveGroup(action.id);

			if (exclusiveGroup) {
				newMarks = newMarks.filter((mark) => {
					const existingGroup = getExclusiveGroup(mark.actionId);
					return existingGroup !== exclusiveGroup;
				});
			}

			newMarks.push(incomingMark);

			const updatedTooth = addHistoryEntry(
				{ ...current, marks: newMarks },
				"Registro",
				`${action.label} registrado en la pieza.`
			);

			return {
				...prev,
				[toothNumber]: updatedTooth,
			};
		});

		setContextMenu((prev) => ({ ...prev, open: false }));
	}

	function handleRemoveMark(toothNumber, markToRemove) {
		setTeeth((prev) => {
			const current = prev[toothNumber];
			const newMarks = current.marks.filter((mark) => !markEquals(mark, markToRemove));

			const action = getActionById(markToRemove.actionId);
			const detalleBase = action?.label || "Registro";

			const updatedTooth = addHistoryEntry(
				{ ...current, marks: newMarks },
				"Actualización",
				`Se eliminó ${detalleBase}${["V", "L", "M", "D", "O"].includes(markToRemove.area) ? ` de la cara ${markToRemove.area}` : ""}.`
			);

			return {
				...prev,
				[toothNumber]: updatedTooth,
			};
		});
	}

	function handleClearTooth(toothNumber) {
		setTeeth((prev) => ({
			...prev,
			[toothNumber]: {
				...blankTooth(),
				historial: [
					{
						fecha: formatNow(),
						tipo: "Actualización",
						detalle: "Se limpió el registro de la pieza.",
					},
				],
			},
		}));
		setContextMenu((prev) => ({ ...prev, open: false }));
	}

	function handleResetAll() {
		if (!window.confirm("¿Deseas restablecer todo el odontograma?")) return;
		setTeeth(buildBlankTeeth());
		setSelectedTooth(null);
		setNotasGenerales("");
	}

	function handleSaveGeneral() {
		setGuardado(true);
		setTimeout(() => setGuardado(false), 1800);
	}

	function openObservationModal() {
		if (!selectedTooth) return;
		setObservationModal({
			open: true,
			toothNumber: selectedTooth,
		});
	}

	function saveObservation(value) {
		const toothNumber = observationModal.toothNumber;
		if (!toothNumber) return;

		setTeeth((prev) => {
			const updatedTooth = addHistoryEntry(
				{
					...prev[toothNumber],
					observacion: value,
				},
				"Observación",
				value || "Observación eliminada."
			);

			return {
				...prev,
				[toothNumber]: updatedTooth,
			};
		});

		setObservationModal({
			open: false,
			toothNumber: null,
		});
	}

	return (
		<div ref={pageRef} className="min-h-screen bg-gray-100 text-gray-800">
			<Navbar />

			<ContextMenu
				open={contextMenu.open}
				x={contextMenu.x}
				y={contextMenu.y}
				onClose={() => setContextMenu((prev) => ({ ...prev, open: false }))}
				onSelectAction={handleSelectAction}
				onClearTooth={() => handleClearTooth(contextMenu.toothNumber)}
			/>

			<ObservationModal
				open={observationModal.open}
				toothNumber={observationModal.toothNumber}
				initialValue={
					observationModal.toothNumber
						? teeth[observationModal.toothNumber]?.observacion || ""
						: ""
				}
				onClose={() =>
					setObservationModal({ open: false, toothNumber: null })
				}
				onSave={saveObservation}
			/>

			<div className="flex">
				<aside className="w-[340px] flex-shrink-0 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col gap-4">
					<div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="rounded-xl bg-sky-100 p-2 text-sky-700">
								<UserRound size={18} />
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-800">Paciente</p>
								<p className="text-xs text-gray-500">
									Busca y selecciona rápidamente
								</p>
							</div>
						</div>

						<PatientAutocomplete
							options={patientOptions}
							selectedId={pacienteId}
							query={patientQuery}
							setQuery={setPatientQuery}
							onSelect={selectPatient}
						/>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
								<Stethoscope size={18} />
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-800">Dentición</p>
								<p className="text-xs text-gray-500">
									Selecciona el tipo para la vista
								</p>
							</div>
						</div>

						<div className="flex gap-3">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="dentadura"
									className="radio radio-sm radio-primary"
									checked={dentadura === "permanente"}
									onChange={() => setDentadura("permanente")}
								/>
								<span className="text-sm">Permanente</span>
							</label>

							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="dentadura"
									className="radio radio-sm radio-primary"
									checked={dentadura === "temporal"}
									onChange={() => setDentadura("temporal")}
								/>
								<span className="text-sm">Temporal</span>
							</label>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="rounded-xl bg-violet-100 p-2 text-violet-700">
								<ShieldPlus size={18} />
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-800">
									Acción para caras
								</p>
								<p className="text-xs text-gray-500">
									Luego haz clic en una cara del diente
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-2">
							{[
								"resina",
								"amalgama",
								"material_temporal",
								"caries_cavitada",
								"fractura_coronal",
								"incrustacion",
							].map((id) => {
								const item = getActionById(id);
								if (!item) return null;

								return (
									<button
										key={item.id}
										type="button"
										onClick={() => setFaceActionId(item.id)}
										className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition text-left ${
											faceActionId === item.id
												? "border-sky-300 bg-sky-50"
												: "border-gray-200 hover:bg-gray-50"
										}`}
									>
										<span
											className="w-3 h-3 rounded-full border border-gray-300"
											style={{ backgroundColor: item.color }}
										/>
										<span className="text-sm">{item.label}</span>
									</button>
								);
							})}
						</div>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white p-4">
						<p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
							Pieza seleccionada
						</p>

						{selectedTooth ? (
							<div className="space-y-3">
								<div>
									<p className="text-base font-semibold text-gray-800">
										Pieza {selectedTooth}
									</p>
									<p className="text-xs text-gray-500">
										Clic derecho sobre la pieza para registrar nuevas acciones.
									</p>
								</div>

								<div className="flex flex-wrap gap-2">
									{selectedMarks.length > 0 ? (
										selectedMarks.map((item) => (
											<div
												key={`${item.actionId}-${item.area}`}
												className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
											>
												<span
													className="w-2.5 h-2.5 rounded-full inline-block"
													style={{ backgroundColor: item.action.color }}
												/>
												<span className="text-gray-700">
													{item.action.label}
													{["V", "L", "M", "D", "O"].includes(item.area)
														? ` ${item.area}`
														: ""}
												</span>
												<button
													type="button"
													onClick={() => handleRemoveMark(selectedTooth, item)}
													className="text-gray-400 hover:text-red-600"
													title="Quitar marca"
												>
													<X size={14} />
												</button>
											</div>
										))
									) : (
										<span className="text-sm text-gray-400">
											Sin registros en esta pieza.
										</span>
									)}
								</div>

								<div className="flex flex-col gap-2">
									<button
										type="button"
										onClick={openObservationModal}
										className="btn btn-sm btn-outline justify-start"
									>
										<FileText size={14} />
										Editar observación
									</button>

									<button
										type="button"
										onClick={() => handleClearTooth(selectedTooth)}
										className="btn btn-sm btn-outline justify-start"
									>
										<X size={14} />
										Limpiar pieza
									</button>
								</div>
							</div>
						) : (
							<div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-400 bg-gray-50">
								Selecciona una pieza para ver su detalle.
							</div>
						)}
					</div>

					<div className="mt-auto pt-2 flex flex-col gap-2">
						<button
							type="button"
							className="btn btn-ghost gap-2"
							onClick={handleResetAll}
						>
							<RotateCcw size={15} />
							Restablecer todo
						</button>

						<button
							type="button"
							className="btn btn-primary gap-2"
							onClick={handleSaveGeneral}
						>
							<Save size={15} />
							{guardado ? "¡Guardado!" : "Guardar odontograma"}
						</button>
					</div>
				</aside>

				<main className="flex-1 p-5 overflow-x-auto">
					<div className="flex flex-wrap items-center gap-3 mb-4">
						<div className="badge badge-lg badge-outline bg-white">
							Clic derecho en una pieza para registrar
						</div>

						{currentFaceAction && (
							<div className="badge badge-lg bg-sky-100 text-sky-800 border-sky-300 gap-2">
								<span
									className="w-2.5 h-2.5 rounded-full inline-block"
									style={{ backgroundColor: currentFaceAction.color }}
								/>
								Caras activas con {currentFaceAction.label}
							</div>
						)}

						{selectedPatient && (
							<div className="badge badge-lg bg-white border-gray-300 text-gray-700 gap-2">
								<UserRound size={14} />
								{selectedPatient.nombre}
							</div>
						)}
					</div>

					<div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 min-w-[920px]">
						<div className="mb-4">
							<h1 className="text-xl font-bold text-gray-800">
								Odontograma clínico
							</h1>
							<p className="text-sm text-gray-500">
								Vista gráfica por pieza, caras, observaciones y registros del paciente.
							</p>
						</div>

						{isPerm ? (
							<>
								<div className="grid grid-cols-2 border-b-2 border-dashed border-gray-200 pb-6 mb-6">
									<div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
										{renderQuadrant(SUP_DER, true)}
									</div>

									<div className="flex justify-start pl-1">
										{renderQuadrant(SUP_IZQ, true)}
									</div>
								</div>

								<div className="grid grid-cols-2">
									<div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
										{renderQuadrant(INF_IZQ, false)}
									</div>

									<div className="flex justify-start pl-1">
										{renderQuadrant(INF_DER, false)}
									</div>
								</div>
							</>
						) : (
							<>
								<p className="text-center text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">
									Dentición temporal
								</p>

								<div className="grid grid-cols-2 border-b-2 border-dashed border-gray-200 pb-6 mb-6">
									<div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
										{renderQuadrant(TEMP_SD, true, true)}
									</div>

									<div className="flex justify-start pl-1">
										{renderQuadrant(TEMP_SI, true, true)}
									</div>
								</div>

								<div className="grid grid-cols-2">
									<div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
										{renderQuadrant(TEMP_II, false, true)}
									</div>

									<div className="flex justify-start pl-1">
										{renderQuadrant(TEMP_ID, false, true)}
									</div>
								</div>
							</>
						)}
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
						<div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm xl:col-span-1">
							<p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
								<ClipboardList size={16} />
								Notas generales
							</p>

							<textarea
								className="textarea textarea-bordered w-full text-sm h-32 resize-none"
								placeholder="Observaciones generales del odontograma..."
								value={notasGenerales}
								onChange={(e) => setNotasGenerales(e.target.value)}
							/>
						</div>

						<div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm xl:col-span-1">
							<p className="text-sm font-semibold text-gray-700 mb-3">
								Leyenda principal
							</p>

							<div className="grid grid-cols-1 gap-2">
								{[
									{ color: STATUS_COLORS.verde, text: "Resina y sellante" },
									{ color: STATUS_COLORS.azul, text: "Amalgama, coronas y endodoncia" },
									{ color: STATUS_COLORS.rojo, text: "Caries, material temporal, exodoncia y resto radicular" },
									{ color: STATUS_COLORS.negro, text: "Ausente, implante y ortodoncia fija" },
								].map((item) => (
									<div key={item.text} className="flex items-center gap-2">
										<span
											className="w-4 h-4 rounded border border-gray-300"
											style={{ backgroundColor: item.color }}
										/>
										<span className="text-sm text-gray-600">{item.text}</span>
									</div>
								))}
							</div>
						</div>

						<div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm xl:col-span-1">
							<p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
								<History size={16} />
								Historial de pieza
							</p>

							{selectedTooth && selectedToothData?.historial?.length > 0 ? (
								<div className="space-y-2 max-h-56 overflow-y-auto pr-1">
									{selectedToothData.historial.map((item, index) => (
										<div
											key={`${item.fecha}-${index}`}
											className="rounded-xl border border-gray-200 p-3 bg-gray-50"
										>
											<p className="text-xs text-gray-400">{item.fecha}</p>
											<p className="text-sm font-medium text-gray-700">
												{item.tipo}
											</p>
											<p className="text-sm text-gray-600">{item.detalle}</p>
										</div>
									))}
								</div>
							) : (
								<div className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-300 p-4 bg-gray-50">
									Selecciona una pieza con registros para consultar su historial.
								</div>
							)}
						</div>
					</div>

					{selectedTooth && (
						<div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
							<p className="text-sm font-semibold text-gray-700 mb-2">
								Observación de la pieza {selectedTooth}
							</p>

							<p className="text-sm text-gray-600 whitespace-pre-wrap">
								{selectedToothData?.observacion?.trim()
									? selectedToothData.observacion
									: "Sin observación registrada."}
							</p>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}