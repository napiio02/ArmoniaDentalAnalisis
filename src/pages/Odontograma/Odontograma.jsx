import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import { PACIENTES } from "../../data/mockData";
import OdontogramaChart from "./components/OdontogramaChart";

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

import {
	CONTEXT_ACTIONS,
	FACE_ACTION_IDS,
	MAIN_LEGEND,
} from "./data/odontogramaConstants";

import {
	blankTooth,
	buildBlankTeeth,
	getActionById,
	normalizeText,
	getExclusiveGroup,
	markEquals,
	buildPatientOptions,
	buildRegisterEvent,
	buildRemoveEvent,
	buildClearToothEvent,
	buildObservationEvent,
	buildOdontogramaPayload,
} from "./utils/odontogramaHelpers";

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
   MENÚ PRINCIPAL DE PIEZA
========================================================= */
function ToothMenu({ open, x, y, onClose, onViewInfo, onOpenActions }) {
	if (!open) return null;

	return (
		<>
			<div className="fixed inset-0 z-40" onClick={onClose} />

			<div
				className="fixed z-50 w-52 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
				style={{ left: x, top: y }}
			>
				<div className="px-4 py-3 border-b bg-gray-50">
					<p className="text-sm font-semibold text-gray-700">
						Opciones de pieza
					</p>
				</div>

				<div className="p-2">
					<button
						type="button"
						onClick={onViewInfo}
						className="w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
					>
						Ver info
					</button>

					<button
						type="button"
						onClick={onOpenActions}
						className="w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
					>
						Acciones en pieza
					</button>
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

	const [pendingEvents, setPendingEvents] = useState([]);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const [contextMenu, setContextMenu] = useState({
		open: false,
		x: 0,
		y: 0,
		toothNumber: null,
	});

	const [toothMenu, setToothMenu] = useState({
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

	const patientOptions = useMemo(() => buildPatientOptions(PACIENTES), []);

	const selectedPatient = useMemo(
		() => patientOptions.find((p) => p._id === pacienteId) || null,
		[pacienteId, patientOptions]
	);

	const selectedToothData = selectedTooth ? teeth[selectedTooth] : null;

	const currentFaceAction = useMemo(
		() => getActionById(faceActionId),
		[faceActionId]
	);

	const selectedMarks = useMemo(() => {
		if (!selectedToothData?.marks?.length) return [];

		return selectedToothData.marks
			.map((mark, index) => {
				const action = getActionById(mark.actionId);
				return {
					...mark,
					index,
					action,
				};
			})
			.filter((item) => item.action);
	}, [selectedToothData]);

	const selectedPendingEvents = useMemo(() => {
		if (!selectedTooth) return [];

		return pendingEvents
			.filter((event) => event.pieza_numero === Number(selectedTooth))
			.slice()
			.reverse();
	}, [pendingEvents, selectedTooth]);

	const selectedSavedHistory = useMemo(() => {
		if (!selectedToothData?.historial?.length) return [];
		return selectedToothData.historial;
	}, [selectedToothData]);

	useEffect(() => {
		if (selectedPatient) {
			setPatientQuery(selectedPatient.nombre);
		}
	}, [selectedPatient]);

	useEffect(() => {
		setTeeth(buildBlankTeeth());
		setSelectedTooth(null);
		setNotasGenerales("");
		setDentadura("permanente");
		setPendingEvents([]);
		setHasUnsavedChanges(false);
	}, [pacienteId]);

	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === "Escape") {
				setContextMenu((prev) => ({ ...prev, open: false }));
				setToothMenu((prev) => ({ ...prev, open: false }));
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, []);

	function addPendingEvent(event) {
		setPendingEvents((prev) => [...prev, event]);
		setHasUnsavedChanges(true);
	}

	function getSafeMenuPosition(clientX, clientY, width = 330, height = 520) {
		const margin = 12;

		const maxX = window.innerWidth - width - margin;
		const maxY = window.innerHeight - height - margin;

		const x = Math.min(Math.max(clientX, margin), maxX);
		const y = Math.min(Math.max(clientY, margin), maxY);

		return { x, y };
	}

	function openContextMenu(event, toothNumber) {
		event.preventDefault();
		event.stopPropagation();

		setSelectedTooth(toothNumber);
		setToothMenu((prev) => ({ ...prev, open: false }));

		const position = getSafeMenuPosition(event.clientX, event.clientY, 330, 520);

		setContextMenu({
			open: true,
			x: position.x,
			y: position.y,
			toothNumber,
		});
	}

	function handleToothClick(event, toothNumber) {
		event.preventDefault();
		event.stopPropagation();

		setSelectedTooth(toothNumber);
		setContextMenu((prev) => ({ ...prev, open: false }));

		const position = getSafeMenuPosition(event.clientX, event.clientY, 210, 150);

		setToothMenu({
			open: true,
			x: position.x,
			y: position.y,
			toothNumber,
		});
	}

	function selectPatient(patient) {
		if (hasUnsavedChanges) {
			const confirmChange = window.confirm(
				"Tienes cambios pendientes sin guardar. Si cambias de paciente, se perderán. ¿Deseas continuar?"
			);

			if (!confirmChange) return;
		}

		setPacienteId(patient._id);
		setPatientQuery(patient.nombre);
	}

	function handleFaceClick(toothNumber, face) {
		if (!faceActionId) return;

		const action = getActionById(faceActionId);
		if (!action) return;
		if (!["faces", "shape"].includes(action.type)) return;

		const current = teeth[toothNumber];
		if (!current) return;

		const existing = current.marks.find(
			(mark) => mark.area === face && mark.actionId === action.id
		);

		if (existing) return;

		const sameFaceIndex = current.marks.findIndex((mark) => mark.area === face);
		let newMarks = [...current.marks];

		if (sameFaceIndex >= 0) {
			newMarks.splice(sameFaceIndex, 1);
		}

		newMarks.push({ actionId: action.id, area: face });

		setSelectedTooth(toothNumber);

		setTeeth((prev) => ({
			...prev,
			[toothNumber]: {
				...prev[toothNumber],
				marks: newMarks,
			},
		}));

		addPendingEvent(buildRegisterEvent(toothNumber, action.id, face));
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

		const current = teeth[toothNumber];
		if (!current) return;

		const area = action.type === "label" ? "label" : "whole";
		const incomingMark = { actionId: action.id, area };

		const alreadyExists = current.marks.some((mark) =>
			markEquals(mark, incomingMark)
		);

		if (alreadyExists) {
			setContextMenu((prev) => ({ ...prev, open: false }));
			return;
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

		setTeeth((prev) => ({
			...prev,
			[toothNumber]: {
				...prev[toothNumber],
				marks: newMarks,
			},
		}));

		addPendingEvent(buildRegisterEvent(toothNumber, action.id, area));

		setContextMenu((prev) => ({ ...prev, open: false }));
	}

	function handleRemoveMark(toothNumber, markToRemove) {
		const current = teeth[toothNumber];
		if (!current) return;

		const newMarks = current.marks.filter(
			(mark) => !markEquals(mark, markToRemove)
		);

		setTeeth((prev) => ({
			...prev,
			[toothNumber]: {
				...prev[toothNumber],
				marks: newMarks,
			},
		}));

		addPendingEvent(buildRemoveEvent(toothNumber, markToRemove));
	}

	function handleClearTooth(toothNumber) {
		if (!toothNumber) return;

		const current = teeth[toothNumber];

		setTeeth((prev) => ({
			...prev,
			[toothNumber]: {
				...blankTooth(),
				historial: current?.historial || [],
			},
		}));

		addPendingEvent(buildClearToothEvent(toothNumber));

		setContextMenu((prev) => ({ ...prev, open: false }));
		setToothMenu((prev) => ({ ...prev, open: false }));
	}

	function handleResetAll() {
		if (!window.confirm("¿Deseas restablecer todo el odontograma?")) return;

		setTeeth(buildBlankTeeth());
		setSelectedTooth(null);
		setNotasGenerales("");
		setPendingEvents([]);
		setHasUnsavedChanges(false);
	}

	function handleSaveGeneral() {
		if (!pacienteId) {
			alert("Debes seleccionar un paciente antes de guardar el odontograma.");
			return;
		}

		const payload = buildOdontogramaPayload({
			pacienteId,
			expedienteId: selectedPatient?.expediente_id || "",
			dentadura,
			teeth,
			notasGenerales,
			pendingEvents,
		});

		console.log("Payload listo para enviar a Mongo:", payload);

		setTeeth((prev) => {
			const updated = { ...prev };

			for (const event of pendingEvents) {
				const toothNumber = event.pieza_numero;

				if (!updated[toothNumber]) continue;

				updated[toothNumber] = {
					...updated[toothNumber],
					historial: [
						{
							fecha: event.fecha_visual,
							tipo: event.tipo_evento,
							detalle: event.detalle,
							pendiente: false,
						},
						...(updated[toothNumber].historial || []),
					],
				};
			}

			return updated;
		});

		setPendingEvents([]);
		setHasUnsavedChanges(false);

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

		setTeeth((prev) => ({
			...prev,
			[toothNumber]: {
				...prev[toothNumber],
				observacion: value,
			},
		}));

		addPendingEvent(buildObservationEvent(toothNumber, value));

		setObservationModal({
			open: false,
			toothNumber: null,
		});
	}

	function handleNotasGeneralesChange(value) {
		setNotasGenerales(value);
		setHasUnsavedChanges(true);
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

			<ToothMenu
				open={toothMenu.open}
				x={toothMenu.x}
				y={toothMenu.y}
				onClose={() => setToothMenu((prev) => ({ ...prev, open: false }))}
				onViewInfo={() => {
					setSelectedTooth(toothMenu.toothNumber);
					setToothMenu((prev) => ({ ...prev, open: false }));
				}}
				onOpenActions={() => {
					const fakeEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						clientX: toothMenu.x,
						clientY: toothMenu.y,
					};

					openContextMenu(fakeEvent, toothMenu.toothNumber);
				}}
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
									onChange={() => {
										setDentadura("permanente");
										setHasUnsavedChanges(true);
									}}
								/>
								<span className="text-sm">Permanente</span>
							</label>

							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="dentadura"
									className="radio radio-sm radio-primary"
									checked={dentadura === "temporal"}
									onChange={() => {
										setDentadura("temporal");
										setHasUnsavedChanges(true);
									}}
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
							{FACE_ACTION_IDS.map((id) => {
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
										Haz clic en una pieza para ver opciones
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

					{pendingEvents.length > 0 && (
						<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
							<p className="text-sm font-semibold text-amber-800">
								Cambios pendientes
							</p>
							<p className="text-xs text-amber-700 mt-1">
								Hay {pendingEvents.length} evento
								{pendingEvents.length === 1 ? "" : "s"} sin guardar.
							</p>
						</div>
					)}

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
					<OdontogramaChart
						dentadura={dentadura}
						teeth={teeth}
						selectedTooth={selectedTooth}
						selectedPatient={selectedPatient}
						currentFaceAction={currentFaceAction}
						onToothClick={handleToothClick}
						onFaceClick={handleFaceClick}
						onContextMenu={openContextMenu}
					/>

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
								onChange={(e) => handleNotasGeneralesChange(e.target.value)}
							/>
						</div>

						<div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm xl:col-span-1">
							<p className="text-sm font-semibold text-gray-700 mb-3">
								Leyenda principal
							</p>

							<div className="grid grid-cols-1 gap-2">
								{MAIN_LEGEND.map((item) => (
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

							{selectedTooth &&
							(selectedPendingEvents.length > 0 ||
								selectedSavedHistory.length > 0) ? (
								<div className="space-y-2 max-h-56 overflow-y-auto pr-1">
									{selectedPendingEvents.map((item) => (
										<div
											key={item.id_temporal}
											className="rounded-xl border border-amber-200 p-3 bg-amber-50"
										>
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-amber-600">
													{item.fecha_visual}
												</p>
												<span className="badge badge-sm bg-amber-100 text-amber-700 border-amber-200">
													Pendiente
												</span>
											</div>
											<p className="text-sm font-medium text-amber-800">
												{item.tipo_evento}
											</p>
											<p className="text-sm text-amber-700">{item.detalle}</p>
										</div>
									))}

									{selectedSavedHistory.map((item, index) => (
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