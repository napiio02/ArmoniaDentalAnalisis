import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import { obtenerPacientesConExpediente } from "../../services/pacienteService";
import OdontogramaChart from "./components/OdontogramaChart";
import toast, { Toaster } from "react-hot-toast";
import {
    CheckCircle2,
    AlertTriangle,
    Info,
    XCircle
} from "lucide-react";

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

import {
	guardarOdontograma,
	obtenerOdontogramaPorPaciente,
} from "../../services/odontogramaService";

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
			.filter((p) => {
				const cedula = normalizeText(p.cedula || "");
				const nombre = normalizeText(p.nombre || "");

				return cedula.includes(term) || nombre.includes(term);
			})
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
					placeholder="Buscar paciente por cédula"
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
						<div>
							<p className="font-medium">{selectedPatient.nombre}</p>
							<p className="text-xs text-sky-700">
								Cédula: {selectedPatient.cedula || "Sin cédula registrada"}
							</p>
						</div>
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
									className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-50 ${selectedId === patient._id ? "bg-sky-50" : ""
										}`}
								>
									<div className="rounded-full bg-gray-100 p-2 text-gray-500">
										<UserRound size={14} />
									</div>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-gray-800">
											{patient.cedula || "Sin cédula"}
										</p>
										<p className="text-xs text-gray-500">
											{patient.nombre || "Paciente sin nombre"}
										</p>
									</div>


								</button>
							))
						) : (
							<div className="px-3 py-4 text-sm text-gray-400">
								No se encontraron pacientes con esa cédula o nombre.
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
	const [pacientes, setPacientes] = useState([]);
	const [cargandoPacientes, setCargandoPacientes] = useState(false);
	const [errorPacientes, setErrorPacientes] = useState("");

	const [pacienteId, setPacienteId] = useState("");
	const [patientQuery, setPatientQuery] = useState("");
	const [dentadura, setDentadura] = useState("permanente");
	const [teeth, setTeeth] = useState(buildBlankTeeth());
	const [selectedTooth, setSelectedTooth] = useState(null);
	const [guardado, setGuardado] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [cargandoOdontograma, setCargandoOdontograma] = useState(false);
	const [errorOdontograma, setErrorOdontograma] = useState("");
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

	const [faceActionId, setFaceActionId] = useState("");

	const [observationModal, setObservationModal] = useState({
		open: false,
		toothNumber: null,
	});

	const pageRef = useRef(null);

	const patientOptions = useMemo(
		() => buildPatientOptions(pacientes),
		[pacientes]
	);

	const selectedPatient = useMemo(
		() => patientOptions.find((p) => p._id === pacienteId) || null,
		[pacienteId, patientOptions]
	);

	useEffect(() => {
		async function cargarPacientes() {
			try {
				setCargandoPacientes(true);
				setErrorPacientes("");

				const respuesta = await obtenerPacientesConExpediente();

				setPacientes(respuesta.data || []);
			} catch (error) {
				console.error("Error cargando pacientes:", error);
				setErrorPacientes(error.message);
			} finally {
				setCargandoPacientes(false);
			}
		}

		cargarPacientes();
	}, []);

	const selectedToothData = selectedTooth ? teeth[selectedTooth] : null;

	const currentFaceAction = useMemo(
		() => getActionById(faceActionId),
		[faceActionId]
	);


const visibleTeeth = useMemo(() => {
	const filtered = {};

	for (const [numero, tooth] of Object.entries(teeth)) {
		const marks = tooth.marks || [];

		/*
		   PRIORIDAD VISUAL MÁXIMA:
		   Si la pieza está marcada como ausente, solo mostramos "ausente".
		   Esto evita que se vean exodoncia, resina, amalgama, caries, etc.
		   encima de una pieza que ya está ausente.
		*/
		const ausenteMark = marks.find((mark) => mark.actionId === "ausente");

		if (ausenteMark) {
			filtered[numero] = {
				...tooth,
				marks: [ausenteMark],
			};

			continue;
		}

		/*
		   Si no hay una capa/acción de caras seleccionada,
		   mostramos todo el odontograma completo.
		*/
		if (!faceActionId) {
			filtered[numero] = {
				...tooth,
				marks,
			};

			continue;
		}

		/*
		   Si hay una capa activa, por ejemplo resina o amalgama:
		   - Mostramos solo esa acción en las caras.
		   - Pero mantenemos visibles las acciones generales de la pieza:
		     exodoncia, implante, coronas, endodoncia, brackets, etc.
		*/
		filtered[numero] = {
			...tooth,
			marks: marks.filter((mark) => {
				const action = getActionById(mark.actionId);

				if (!action) return false;

				if (["whole", "label"].includes(action.type)) {
					return true;
				}

				return mark.actionId === faceActionId;
			}),
		};
	}

	return filtered;
}, [teeth, faceActionId]);



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
			setPatientQuery(selectedPatient.cedula || selectedPatient.nombre || "");
		}
	}, [selectedPatient]);

	useEffect(() => {
		async function cargarOdontogramaPaciente() {
			setTeeth(buildBlankTeeth());
			setSelectedTooth(null);
			setNotasGenerales("");
			setDentadura("permanente");
			setPendingEvents([]);
			setHasUnsavedChanges(false);
			setErrorOdontograma("");

			if (!pacienteId) return;

			try {
				setCargandoOdontograma(true);

				const respuesta = await obtenerOdontogramaPorPaciente(pacienteId);
				const odontograma = respuesta?.data;

				if (!odontograma) return;

				setDentadura(odontograma.dentadura || "permanente");
				setNotasGenerales(odontograma.notas_generales || "");

				if (odontograma.teeth) {
					setTeeth({
						...buildBlankTeeth(),
						...odontograma.teeth,
					});
				}
			} catch (error) {
				setErrorOdontograma(error.message);
			} finally {
				setCargandoOdontograma(false);
			}
		}

		cargarOdontogramaPaciente();
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
		setPatientQuery(patient.cedula || patient.nombre || "");
	}



	function handleFaceClick(toothNumber, face) {
		if (!faceActionId) {
			showToast({
				type: "error",
				title: "Accion faltante",
				message:
					`Primero selecciona una acción para aplicar sobre la cara dental.`
			});
			
			return;
		}

		const action = getActionById(faceActionId);
		if (!action) return;

		if (!["faces", "shape"].includes(action.type)) {
			showToast({
				type: "error",
				title: "Acción no válida",
				message:
					`La acción seleccionada no se aplica por caras.`
			});
			return;
		}

		const current = teeth[toothNumber];
		if (!current) return;

		const alreadyExists = current.marks.some(
			(mark) => mark.area === face && mark.actionId === action.id
		);

		if (alreadyExists) {
			showToast({
				type: "error",
				title: "Acción duplicada",
				message:
					`${action.label} ya está registrada en la cara ${face} de la pieza ${toothNumber}.`
			});
			return;
		}

		

		const newMarks = [
			...current.marks,
			{
				actionId: action.id,
				area: face,
			},
		];

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
		setTeeth(buildBlankTeeth());
		setSelectedTooth(null);
		setNotasGenerales("");
		setPendingEvents([]);
		setHasUnsavedChanges(false);

		showToast({
			type: "success",
			title: "Odontograma restablecido",
			message:
				"Se eliminaron registros, observaciones y cambios pendientes."
		});
	}

	async function handleSaveGeneral() {
		if (!pacienteId) {
			showToast({
				type: "error",
				title: "Accion faltante",
				message:
					`Debes seleccionar un paciente antes de guardar el odontograma.`
			});
			return;
		}

		if (!selectedPatient?.expediente_id) {
			showToast({
				type: "error",
				title: "Paciente sin expediente",
				message:
					"El paciente seleccionado no tiene expediente clínico asociado."
			});
			return;
		}

		try {
			setGuardando(true);
			setErrorOdontograma("");

			const payload = buildOdontogramaPayload({
				pacienteId,
				expedienteId: selectedPatient.expediente_id,
				dentadura,
				teeth,
				notasGenerales,
				pendingEvents,
			});

			const respuesta = await guardarOdontograma(payload);
			const odontogramaGuardado = respuesta?.data;

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

			console.log("Odontograma guardado en Mongo:", odontogramaGuardado);

			setPendingEvents([]);
			setHasUnsavedChanges(false);

			setGuardado(true);
			showToast({
				type: "success",
				title: "Odontograma guardado",
				message: "El odontograma se ha guardado correctamente."
			});
			setTimeout(() => setGuardado(false), 1800);
		} catch (error) {
			console.error("Error guardando odontograma:", error);
			setErrorOdontograma(error.message);
			showToast({
				type: "error",
				title: "Error al guardar",
				message: error.message
			});
		} finally {
			setGuardando(false);
		}
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

		const showToast = ({
	type = "info",
	title,
	message,
	}) => {

	const config = {
		success: {
		icon: <CheckCircle2 size={18} />,
		accent: "emerald",
		border: "border-emerald-200/60",
		iconBg: "bg-emerald-100",
		iconColor: "text-emerald-600",
		progress: "bg-emerald-500",
		},

		error: {
		icon: <XCircle size={18} />,
		accent: "red",
		border: "border-red-200/60",
		iconBg: "bg-red-100",
		iconColor: "text-red-600",
		progress: "bg-red-500",
		},

		warning: {
		icon: <AlertTriangle size={18} />,
		accent: "amber",
		border: "border-amber-200/60",
		iconBg: "bg-amber-100",
		iconColor: "text-amber-600",
		progress: "bg-amber-500",
		},

		info: {
		icon: <Info size={18} />,
		accent: "sky",
		border: "border-sky-200/60",
		iconBg: "bg-sky-100",
		iconColor: "text-sky-600",
		progress: "bg-sky-500",
		},
	};

	const current = config[type];

	toast.custom(
		(t) => (
		<div
		className={`

			relative
			overflow-hidden

			min-w-[360px]
			max-w-[430px]

			rounded-2xl
			border
			${current.border}

			bg-white

			shadow-[0_20px_60px_rgba(15,23,42,0.12)]

			transition-all
			duration-500
			ease-[cubic-bezier(.16,1,.3,1)]

			${
			t.visible
				? "translate-y-0 opacity-100 scale-100"
				: "translate-y-3 opacity-0 scale-95"
			}

		`}
		>

			<div className="flex gap-4 p-5">

			<div
				className={`
				h-11
				w-11
				shrink-0
				rounded-xl

				${current.iconBg}
				${current.iconColor}

				flex
				items-center
				justify-center
				`}
			>
				{current.icon}
			</div>

			<div className="flex-1 min-w-0">

				<h3 className="text-[14px] font-semibold text-slate-900">
				{title}
				</h3>

				<p className="mt-1 text-[13px] leading-relaxed text-slate-500">
				{message}
				</p>

			</div>

			<button
				onClick={() => toast.dismiss(t.id)}
				className="
				text-slate-400
				hover:text-slate-700
				transition
				"
			>
				<X size={16} />
			</button>

			</div>

			<div className="h-[3px] w-full bg-slate-100">

			<div
				className={`
				h-full
				${current.progress}

				animate-[toastbar_4.2s_linear_forwards]
				`}
			/>

			</div>

		</div>
		),
		{
		duration: 4200,
		}
	);
	};

	return (
		<div ref={pageRef} className="min-h-screen bg-gray-100 text-gray-800">

			<Toaster
			position="top-right"
			gutter={12}
			containerStyle={{
				top: 24,
				right: 24,
			}}
			toastOptions={{
				removeDelay: 600,
				style: {
				background: "transparent",
				boxShadow: "none",
				padding: 0,
				},
			}}
			/>

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
						preventDefault: () => { },
						stopPropagation: () => { },
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
									Busca por cédula o nombre
								</p>
							</div>
						</div>

						{cargandoPacientes && (
							<div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
								Cargando pacientes...
							</div>
						)}

						{errorPacientes && (
							<div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{errorPacientes}
							</div>
						)}

						{!cargandoPacientes && !errorPacientes && (
							<PatientAutocomplete
								options={patientOptions}
								selectedId={pacienteId}
								query={patientQuery}
								setQuery={setPatientQuery}
								onSelect={selectPatient}
							/>
						)}
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
										className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition text-left ${faceActionId === item.id
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
							disabled={guardando}
						>
							<Save size={15} />
							{guardando ? "Guardando..." : guardado ? "¡Guardado!" : "Guardar odontograma"}
						</button>
					</div>
				</aside>

				<main className="flex-1 p-5 overflow-x-auto">
					{cargandoOdontograma && (
						<div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
							Cargando odontograma del paciente...
						</div>
					)}

					{errorOdontograma && (
						<div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{errorOdontograma}
						</div>
					)}
					<OdontogramaChart
						dentadura={dentadura}
						teeth={visibleTeeth}
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

							{selectedTooth && selectedSavedHistory.length > 0 ? (
								<div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
									{selectedTooth
										? "Esta pieza no tiene historial guardado todavía."
										: "Selecciona una pieza para consultar su historial guardado."}
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