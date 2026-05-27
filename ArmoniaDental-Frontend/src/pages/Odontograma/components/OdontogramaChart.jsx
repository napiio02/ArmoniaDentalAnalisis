import { UserRound } from "lucide-react";
import ToothSVG from "./ToothSVG";

import {
	SUP_DER,
	SUP_IZQ,
	INF_IZQ,
	INF_DER,
	TEMP_SD,
	TEMP_SI,
	TEMP_II,
	TEMP_ID,
	CIRCLE_FACES,
} from "../data/odontogramaConstants";

import {
	getTopLabels,
	getFaceColor,
} from "../utils/odontogramaHelpers";

/* =========================================================
   CÍRCULO DE CARAS
========================================================= */
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
				<div
					className={`rounded-md transition ${
						isSelected ? "ring-2 ring-sky-300" : ""
					}`}
				>
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
				<div
					className={`rounded-md transition ${
						isSelected ? "ring-2 ring-sky-300" : ""
					}`}
				>
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
				className={`font-mono font-semibold ${
					small ? "text-[9px]" : "text-[10px]"
				} ${isSelected ? "text-sky-700" : "text-gray-500"}`}
			>
				{num}
			</span>
		</div>
	);
}

/* =========================================================
   ODONTOGRAMA GRÁFICO
========================================================= */
export default function OdontogramaChart({
	dentadura,
	teeth,
	selectedTooth,
	selectedPatient,
	currentFaceAction,
	onToothClick,
	onFaceClick,
	onContextMenu,
}) {
	const isPerm = dentadura === "permanente";

	const renderQuadrant = (nums, upper, small = false) => (
		<div className="flex items-end gap-0.5 justify-center">
			{nums.map((n) => (
				<ToothCol
					key={n}
					num={n}
					upper={upper}
					tooth={teeth[n]}
					onToothClick={onToothClick}
					onFaceClick={onFaceClick}
					onContextMenu={onContextMenu}
					small={small}
					isSelected={selectedTooth === n}
				/>
			))}
		</div>
	);

	return (
		<>
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
		</>
	);
}