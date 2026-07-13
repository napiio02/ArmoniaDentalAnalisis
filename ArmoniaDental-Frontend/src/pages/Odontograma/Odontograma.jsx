import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { obtenerPacientesConExpediente } from "../../services/pacienteService";
import OdontogramaChart from "./components/OdontogramaChart";
import toast, { Toaster } from "react-hot-toast";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
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

/* ── PatientAutocomplete ─────────────────────────────────── */
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
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
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
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e]"
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
          className="w-full pl-10 pr-10 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3f484e] hover:text-[#151c27]"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {selectedPatient && (
        <div className="mt-2 rounded-xl border border-[#006686]/20 bg-[#7dd3fc20] px-3 py-2 text-sm text-[#006686]">
          <div className="flex items-center gap-2">
            <UserRound size={14} />
            <div>
              <p className="font-semibold">{selectedPatient.nombre}</p>
              <p className="text-xs text-[#3f484e]">
                Cédula: {selectedPatient.cedula || "Sin cédula registrada"}
              </p>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#bec8ce] bg-white shadow-xl">
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
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-[#f0f3ff] ${selectedId === patient._id ? "bg-[#7dd3fc20]" : ""}`}
                >
                  <div className="rounded-full bg-[#f0f3ff] p-2 text-[#006686]">
                    <UserRound size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#151c27]">
                      {patient.cedula || "Sin cédula"}
                    </p>
                    <p className="text-xs text-[#3f484e]">
                      {patient.nombre || "Paciente sin nombre"}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-[#3f484e]">
                No se encontraron pacientes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ContextMenu ─────────────────────────────────────────── */
function ContextMenu({ open, x, y, onClose, onSelectAction, onClearTooth }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[330px] rounded-2xl border border-[#bec8ce] bg-white shadow-2xl overflow-hidden"
        style={{ left: x, top: y }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-[#f0f3ff]">
          <p className="text-sm font-semibold text-[#151c27]">
            Registrar en pieza
          </p>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#dce2f3] transition text-[#3f484e]"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
        <div className="max-h-[440px] overflow-y-auto">
          {CONTEXT_ACTIONS.map((group) => (
            <div key={group.group} className="p-3 border-b last:border-b-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#3f484e] mb-2">
                {group.group}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectAction(item)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-[#f0f3ff] transition"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-[#151c27]">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-[#3f484e]">
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
        <div className="p-3 border-t bg-[#f0f3ff]">
          <button
            type="button"
            onClick={onClearTooth}
            className="w-full py-2 text-xs font-semibold border border-[#bec8ce] rounded-full text-[#3f484e] hover:bg-[#dce2f3] transition"
          >
            Limpiar pieza completa
          </button>
        </div>
      </div>
    </>
  );
}

/* ── ObservationModal ────────────────────────────────────── */
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
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#bec8ce] overflow-hidden">
          <div className="px-5 py-4 border-b bg-[#f0f3ff] flex justify-between items-center">
            <p className="font-semibold text-[#151c27]">
              Observación clínica de la pieza {toothNumber}
            </p>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#dce2f3] transition text-[#3f484e]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-5">
            <textarea
              className="w-full h-36 text-sm px-4 py-3 border border-[#bec8ce] rounded-xl focus:outline-none focus:border-[#006686] resize-none bg-white text-[#151c27]"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Escribe una observación clínica complementaria..."
            />
          </div>
          <div className="px-5 py-4 border-t bg-[#f0f3ff] flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-white border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(value)}
              className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition"
            >
              Guardar observación
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── ToothMenu ───────────────────────────────────────────── */
function ToothMenu({ open, x, y, onClose, onViewInfo, onOpenActions }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-52 rounded-2xl border border-[#bec8ce] bg-white shadow-2xl overflow-hidden"
        style={{ left: x, top: y }}
      >
        <div className="px-4 py-3 border-b bg-[#f0f3ff]">
          <p className="text-sm font-semibold text-[#151c27]">
            Opciones de pieza
          </p>
        </div>
        <div className="p-2">
          <button
            type="button"
            onClick={onViewInfo}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#151c27] hover:bg-[#f0f3ff] transition"
          >
            Ver info
          </button>
          <button
            type="button"
            onClick={onOpenActions}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#151c27] hover:bg-[#f0f3ff] transition"
          >
            Acciones en pieza
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Odontograma principal ───────────────────────────────── */
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
    [pacientes],
  );
  const selectedPatient = useMemo(
    () => patientOptions.find((p) => p._id === pacienteId) || null,
    [pacienteId, patientOptions],
  );

  useEffect(() => {
    async function cargarPacientes() {
      try {
        setCargandoPacientes(true);
        setErrorPacientes("");
        const respuesta = await obtenerPacientesConExpediente();
        setPacientes(respuesta.data || []);
      } catch (error) {
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
    [faceActionId],
  );

  const visibleTeeth = useMemo(() => {
    const filtered = {};
    for (const [numero, tooth] of Object.entries(teeth)) {
      const marks = tooth.marks || [];
      const ausenteMark = marks.find((mark) => mark.actionId === "ausente");
      if (ausenteMark) {
        filtered[numero] = { ...tooth, marks: [ausenteMark] };
        continue;
      }
      if (!faceActionId) {
        filtered[numero] = { ...tooth, marks };
        continue;
      }
      filtered[numero] = {
        ...tooth,
        marks: marks.filter((mark) => {
          const action = getActionById(mark.actionId);
          if (!action) return false;
          if (["whole", "label"].includes(action.type)) return true;
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
        return { ...mark, index, action };
      })
      .filter((item) => item.action);
  }, [selectedToothData]);

  const selectedPendingEvents = useMemo(() => {
    if (!selectedTooth) return [];
    return pendingEvents
      .filter((e) => e.pieza_numero === Number(selectedTooth))
      .slice()
      .reverse();
  }, [pendingEvents, selectedTooth]);

  const selectedSavedHistory = useMemo(() => {
    if (!selectedToothData?.historial?.length) return [];
    return selectedToothData.historial;
  }, [selectedToothData]);

  useEffect(() => {
    if (selectedPatient)
      setPatientQuery(selectedPatient.cedula || selectedPatient.nombre || "");
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
        if (odontograma.teeth)
          setTeeth({ ...buildBlankTeeth(), ...odontograma.teeth });
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
        setContextMenu((p) => ({ ...p, open: false }));
        setToothMenu((p) => ({ ...p, open: false }));
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  function addPendingEvent(event) {
    setPendingEvents((p) => [...p, event]);
    setHasUnsavedChanges(true);
  }

  function getSafeMenuPosition(clientX, clientY, width = 330, height = 520) {
    const margin = 12;
    const x = Math.min(
      Math.max(clientX, margin),
      window.innerWidth - width - margin,
    );
    const y = Math.min(
      Math.max(clientY, margin),
      window.innerHeight - height - margin,
    );
    return { x, y };
  }

  function openContextMenu(event, toothNumber) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTooth(toothNumber);
    setToothMenu((p) => ({ ...p, open: false }));
    const pos = getSafeMenuPosition(event.clientX, event.clientY, 330, 520);
    setContextMenu({ open: true, x: pos.x, y: pos.y, toothNumber });
  }

  function handleToothClick(event, toothNumber) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTooth(toothNumber);
    setContextMenu((p) => ({ ...p, open: false }));
    const pos = getSafeMenuPosition(event.clientX, event.clientY, 210, 150);
    setToothMenu({ open: true, x: pos.x, y: pos.y, toothNumber });
  }

  function selectPatient(patient) {
    if (hasUnsavedChanges) {
      const ok = window.confirm(
        "Tienes cambios pendientes sin guardar. Si cambias de paciente, se perderán. ¿Deseas continuar?",
      );
      if (!ok) return;
    }
    setPacienteId(patient._id);
    setPatientQuery(patient.cedula || patient.nombre || "");
  }

  function handleFaceClick(toothNumber, face) {
    if (!faceActionId) {
      showToast({
        type: "error",
        title: "Acción faltante",
        message:
          "Primero selecciona una acción para aplicar sobre la cara dental.",
      });
      return;
    }
    const action = getActionById(faceActionId);
    if (!action) return;
    if (!["faces", "shape"].includes(action.type)) {
      showToast({
        type: "error",
        title: "Acción no válida",
        message: "La acción seleccionada no se aplica por caras.",
      });
      return;
    }
    const current = teeth[toothNumber];
    if (!current) return;
    const alreadyExists = current.marks.some(
      (mark) => mark.area === face && mark.actionId === action.id,
    );
    if (alreadyExists) {
      showToast({
        type: "error",
        title: "Acción duplicada",
        message: `${action.label} ya está registrada en la cara ${face} de la pieza ${toothNumber}.`,
      });
      return;
    }
    const newMarks = [...current.marks, { actionId: action.id, area: face }];
    setSelectedTooth(toothNumber);
    setTeeth((prev) => ({
      ...prev,
      [toothNumber]: { ...prev[toothNumber], marks: newMarks },
    }));
    addPendingEvent(buildRegisterEvent(toothNumber, action.id, face));
  }

  function handleSelectAction(action) {
    const toothNumber = contextMenu.toothNumber;
    if (!toothNumber) return;
    setSelectedTooth(toothNumber);
    if (["faces", "shape"].includes(action.type)) {
      setFaceActionId(action.id);
      setContextMenu((p) => ({ ...p, open: false }));
      return;
    }
    const current = teeth[toothNumber];
    if (!current) return;
    const area = action.type === "label" ? "label" : "whole";
    const incomingMark = { actionId: action.id, area };
    if (current.marks.some((mark) => markEquals(mark, incomingMark))) {
      setContextMenu((p) => ({ ...p, open: false }));
      return;
    }
    let newMarks = [...current.marks];
    const exclusiveGroup = getExclusiveGroup(action.id);
    if (exclusiveGroup)
      newMarks = newMarks.filter(
        (mark) => getExclusiveGroup(mark.actionId) !== exclusiveGroup,
      );
    newMarks.push(incomingMark);
    setTeeth((prev) => ({
      ...prev,
      [toothNumber]: { ...prev[toothNumber], marks: newMarks },
    }));
    addPendingEvent(buildRegisterEvent(toothNumber, action.id, area));
    setContextMenu((p) => ({ ...p, open: false }));
  }

  function handleRemoveMark(toothNumber, markToRemove) {
    const current = teeth[toothNumber];
    if (!current) return;
    const newMarks = current.marks.filter(
      (mark) => !markEquals(mark, markToRemove),
    );
    setTeeth((prev) => ({
      ...prev,
      [toothNumber]: { ...prev[toothNumber], marks: newMarks },
    }));
    addPendingEvent(buildRemoveEvent(toothNumber, markToRemove));
  }

  function handleClearTooth(toothNumber) {
    if (!toothNumber) return;
    const current = teeth[toothNumber];
    setTeeth((prev) => ({
      ...prev,
      [toothNumber]: { ...blankTooth(), historial: current?.historial || [] },
    }));
    addPendingEvent(buildClearToothEvent(toothNumber));
    setContextMenu((p) => ({ ...p, open: false }));
    setToothMenu((p) => ({ ...p, open: false }));
  }



  async function handleResetAll() {
    if (!pacienteId) {
      showToast({
        type: "error",
        title: "Paciente no seleccionado",
        message:
          "Debes seleccionar un paciente antes de restablecer el odontograma.",
      });
      return;
    }

    if (!selectedPatient?.expediente_id) {
      showToast({
        type: "error",
        title: "Paciente sin expediente",
        message:
          "El paciente seleccionado no tiene expediente clínico asociado.",
      });
      return;
    }

    const confirmar = window.confirm(
      "¿Deseas vaciar completamente el odontograma?\n\n" +
        "Se eliminarán todos los registros y observaciones actuales de las piezas."
    );

    if (!confirmar) return;

    const dientesVacios = buildBlankTeeth();

    try {
      setGuardando(true);
      setErrorOdontograma("");

      const payload = buildOdontogramaPayload({
        pacienteId,
        expedienteId: selectedPatient.expediente_id,
        dentadura,
        teeth: dientesVacios,
        notasGenerales: "",
        pendingEvents: [],
      });

      await guardarOdontograma(payload);

      setTeeth(dientesVacios);
      setSelectedTooth(null);
      setNotasGenerales("");
      setPendingEvents([]);
      setHasUnsavedChanges(false);
      setFaceActionId("");

      setContextMenu((prev) => ({
        ...prev,
        open: false,
        toothNumber: null,
      }));

      setToothMenu((prev) => ({
        ...prev,
        open: false,
        toothNumber: null,
      }));

      setObservationModal({
        open: false,
        toothNumber: null,
      });

      showToast({
        type: "success",
        title: "Odontograma restablecido",
        message:
          "Los registros y observaciones actuales fueron eliminados correctamente.",
      });
    } catch (error) {
      setErrorOdontograma(error.message);

      showToast({
        type: "error",
        title: "Error al restablecer",
        message:
          error.message ||
          "No se pudo vaciar el odontograma. Inténtalo nuevamente.",
      });
    } finally {
      setGuardando(false);
    }
  }


  async function handleSaveGeneral() {
    if (!pacienteId) {
      showToast({
        type: "error",
        title: "Acción faltante",
        message:
          "Debes seleccionar un paciente antes de guardar el odontograma.",
      });
      return;
    }
    if (!selectedPatient?.expediente_id) {
      showToast({
        type: "error",
        title: "Paciente sin expediente",
        message:
          "El paciente seleccionado no tiene expediente clínico asociado.",
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
      setTeeth((prev) => {
        const updated = { ...prev };
        for (const event of pendingEvents) {
          const n = event.pieza_numero;
          if (!updated[n]) continue;
          updated[n] = {
            ...updated[n],
            historial: [
              {
                fecha: event.fecha_visual,
                tipo: event.tipo_evento,
                detalle: event.detalle,
                pendiente: false,
              },
              ...(updated[n].historial || []),
            ],
          };
        }
        return updated;
      });
      setPendingEvents([]);
      setHasUnsavedChanges(false);
      setGuardado(true);
      showToast({
        type: "success",
        title: "Odontograma guardado",
        message: "El odontograma se ha guardado correctamente.",
      });
      setTimeout(() => setGuardado(false), 1800);
    } catch (error) {
      setErrorOdontograma(error.message);
      showToast({
        type: "error",
        title: "Error al guardar",
        message: error.message,
      });
    } finally {
      setGuardando(false);
    }
  }

  function openObservationModal() {
    if (!selectedTooth) return;
    setObservationModal({ open: true, toothNumber: selectedTooth });
  }

  function saveObservation(value) {
    const toothNumber = observationModal.toothNumber;
    if (!toothNumber) return;
    setTeeth((prev) => ({
      ...prev,
      [toothNumber]: { ...prev[toothNumber], observacion: value },
    }));
    addPendingEvent(buildObservationEvent(toothNumber, value));
    setObservationModal({ open: false, toothNumber: null });
  }

  function handleNotasGeneralesChange(value) {
    setNotasGenerales(value);
    setHasUnsavedChanges(true);
  }

  const showToast = ({ type = "info", title, message }) => {
    const config = {
      success: {
        icon: <CheckCircle2 size={18} />,
        border: "border-[#6df5e1]/30",
        iconBg: "bg-[#6df5e120]",
        iconColor: "text-[#006b5f]",
        progress: "bg-[#006b5f]",
      },
      error: {
        icon: <XCircle size={18} />,
        border: "border-[#ba1a1a]/20",
        iconBg: "bg-[#ffdad6]/50",
        iconColor: "text-[#ba1a1a]",
        progress: "bg-[#ba1a1a]",
      },
      warning: {
        icon: <AlertTriangle size={18} />,
        border: "border-[#855300]/20",
        iconBg: "bg-[#ffddb820]",
        iconColor: "text-[#855300]",
        progress: "bg-[#855300]",
      },
      info: {
        icon: <Info size={18} />,
        border: "border-[#006686]/20",
        iconBg: "bg-[#7dd3fc20]",
        iconColor: "text-[#006686]",
        progress: "bg-[#006686]",
      },
    };
    const c = config[type];
    toast.custom(
      (t) => (
        <div
          className={`relative overflow-hidden min-w-[360px] max-w-[430px] rounded-2xl border ${c.border} bg-white shadow-xl transition-all duration-500 ${t.visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-3 opacity-0 scale-95"}`}
        >
          <div className="flex gap-4 p-5">
            <div
              className={`h-11 w-11 shrink-0 rounded-xl ${c.iconBg} ${c.iconColor} flex items-center justify-center`}
            >
              {c.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-[#151c27]">
                {title}
              </h3>
              <p className="mt-1 text-[13px] text-[#3f484e]">{message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-[#bec8ce] hover:text-[#3f484e] transition"
            >
              <X size={16} />
            </button>
          </div>
          <div className="h-[3px] w-full bg-[#f0f3ff]">
            <div
              className={`h-full ${c.progress} animate-[toastbar_4.2s_linear_forwards]`}
            />
          </div>
        </div>
      ),
      { duration: 4200 },
    );
  };

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]"
    >
      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{ top: 24, right: 24 }}
        toastOptions={{
          removeDelay: 600,
          style: { background: "transparent", boxShadow: "none", padding: 0 },
        }}
      />

      {/* ── Header minimalista ── */}
      <header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link
          to="/expedientes"
          className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
        </Link>
        <div className="w-px h-5 bg-[#bec8ce]" />
        <span className="text-2xl">ꨄ︎</span>
        <span className="font-bold text-[#151c27]">Armonía Dental</span>
        <span className="text-[#bec8ce] mx-1">/</span>
        <Link
          to="/expedientes"
          className="text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
        >
          Expedientes
        </Link>
        <span className="text-[#bec8ce] mx-1">/</span>
        <span className="text-sm font-semibold text-[#006686]">
          Odontograma
        </span>

        {hasUnsavedChanges && (
          <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-[#ffddb820] text-[#855300] border border-[#855300]/20 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              pending
            </span>
            {pendingEvents.length} cambio{pendingEvents.length !== 1 ? "s" : ""}{" "}
            sin guardar
          </span>
        )}
      </header>

      {/* ── Menus ── */}
      <ContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((p) => ({ ...p, open: false }))}
        onSelectAction={handleSelectAction}
        onClearTooth={() => handleClearTooth(contextMenu.toothNumber)}
      />

      <ToothMenu
        open={toothMenu.open}
        x={toothMenu.x}
        y={toothMenu.y}
        onClose={() => setToothMenu((p) => ({ ...p, open: false }))}
        onViewInfo={() => {
          setSelectedTooth(toothMenu.toothNumber);
          setToothMenu((p) => ({ ...p, open: false }));
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
        onClose={() => setObservationModal({ open: false, toothNumber: null })}
        onSave={saveObservation}
      />

      {/* ── Layout ── */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[340px] flex-shrink-0 bg-white border-r border-[#bec8ce] min-h-[calc(100vh-65px)] p-4 flex flex-col gap-4">
          {/* Paciente */}
          <div className="rounded-xl border border-[#bec8ce] bg-[#f0f3ff] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-xl bg-[#7dd3fc20] p-2 text-[#006686]">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#151c27]">Paciente</p>
                <p className="text-xs text-[#3f484e]">
                  Busca por cédula o nombre
                </p>
              </div>
            </div>
            {cargandoPacientes && (
              <div className="rounded-xl border border-[#006686]/20 bg-[#7dd3fc20] px-3 py-2 text-sm text-[#006686]">
                Cargando pacientes...
              </div>
            )}
            {errorPacientes && (
              <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6]/40 px-3 py-2 text-sm text-[#ba1a1a]">
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

          {/* Dentición */}
          <div className="rounded-xl border border-[#bec8ce] bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-xl bg-[#6df5e120] p-2 text-[#006b5f]">
                <Stethoscope size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#151c27]">
                  Dentición
                </p>
                <p className="text-xs text-[#3f484e]">
                  Selecciona el tipo para la vista
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              {["permanente", "temporal"].map((tipo) => (
                <label
                  key={tipo}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${dentadura === tipo ? "border-[#006686]" : "border-[#bec8ce]"}`}
                    onClick={() => {
                      setDentadura(tipo);
                      setHasUnsavedChanges(true);
                    }}
                  >
                    {dentadura === tipo && (
                      <div className="w-2 h-2 rounded-full bg-[#006686]" />
                    )}
                  </div>
                  <span className="text-sm text-[#151c27] capitalize">
                    {tipo}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Acción para caras */}
          <div className="rounded-xl border border-[#bec8ce] bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-xl bg-[#dce2f3] p-2 text-[#3f484e]">
                <ShieldPlus size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#151c27]">
                  Acción para caras
                </p>
                <p className="text-xs text-[#3f484e]">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition text-left ${faceActionId === item.id ? "border-[#006686] bg-[#7dd3fc20]" : "border-[#bec8ce] hover:bg-[#f0f3ff]"}`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[#151c27]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pieza seleccionada */}
          <div className="rounded-xl border border-[#bec8ce] bg-white p-4">
            <p className="text-[10px] font-semibold text-[#3f484e] mb-2 uppercase tracking-wider">
              Pieza seleccionada
            </p>
            {selectedTooth ? (
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-[#151c27]">
                    Pieza {selectedTooth}
                  </p>
                  <p className="text-xs text-[#3f484e]">
                    Haz clic en una pieza para ver opciones
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMarks.length > 0 ? (
                    selectedMarks.map((item) => (
                      <div
                        key={`${item.actionId}-${item.area}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[#bec8ce] bg-[#f0f3ff] px-3 py-1.5 text-sm"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: item.action.color }}
                        />
                        <span className="text-[#151c27]">
                          {item.action.label}
                          {["V", "L", "M", "D", "O"].includes(item.area)
                            ? ` ${item.area}`
                            : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMark(selectedTooth, item)}
                          className="text-[#bec8ce] hover:text-[#ba1a1a] transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-[#bec8ce]">
                      Sin registros en esta pieza.
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={openObservationModal}
                    className="flex items-center gap-2 px-3 py-2 border border-[#bec8ce] rounded-full text-xs font-semibold text-[#3f484e] hover:bg-[#f0f3ff] transition"
                  >
                    <FileText size={14} />
                    Editar observación
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearTooth(selectedTooth)}
                    className="flex items-center gap-2 px-3 py-2 border border-[#bec8ce] rounded-full text-xs font-semibold text-[#3f484e] hover:bg-[#f0f3ff] transition"
                  >
                    <X size={14} />
                    Limpiar pieza
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#bec8ce] p-4 text-sm text-[#bec8ce] bg-[#f9f9ff]">
                Selecciona una pieza para ver su detalle.
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="mt-auto pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center justify-center gap-2 py-2.5 border border-[#bec8ce] rounded-full text-xs font-semibold text-[#3f484e] hover:bg-[#f0f3ff] transition"
            >
              <RotateCcw size={15} />
              Restablecer todo
            </button>
            <button
              type="button"
              onClick={handleSaveGeneral}
              disabled={guardando}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              <Save size={15} />
              {guardando
                ? "Guardando..."
                : guardado
                  ? "¡Guardado!"
                  : "Guardar odontograma"}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-5 overflow-x-auto">
          {cargandoOdontograma && (
            <div className="mb-4 rounded-xl border border-[#006686]/20 bg-[#7dd3fc20] px-4 py-3 text-sm text-[#006686]">
              Cargando odontograma del paciente...
            </div>
          )}
          {errorOdontograma && (
            <div className="mb-4 rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6]/40 px-4 py-3 text-sm text-[#ba1a1a]">
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
            {/* Notas generales */}
            <div className="bg-white border border-[#bec8ce] rounded-xl p-4 shadow-sm xl:col-span-1">
              <p className="text-sm font-semibold text-[#151c27] mb-2 flex items-center gap-2">
                <ClipboardList size={16} className="text-[#006686]" />
                Notas generales
              </p>
              <textarea
                className="w-full h-32 text-sm px-4 py-3 border border-[#bec8ce] rounded-xl focus:outline-none focus:border-[#006686] resize-none bg-white text-[#151c27]"
                placeholder="Observaciones generales del odontograma..."
                value={notasGenerales}
                onChange={(e) => handleNotasGeneralesChange(e.target.value)}
              />
            </div>

            {/* Leyenda */}
            <div className="bg-white border border-[#bec8ce] rounded-xl p-4 shadow-sm xl:col-span-1">
              <p className="text-sm font-semibold text-[#151c27] mb-3">
                Leyenda principal
              </p>
              <div className="grid grid-cols-1 gap-2">
                {MAIN_LEGEND.map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[#3f484e]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial */}
            <div className="bg-white border border-[#bec8ce] rounded-xl p-4 shadow-sm xl:col-span-1">
              <p className="text-sm font-semibold text-[#151c27] mb-2 flex items-center gap-2">
                <History size={16} className="text-[#006686]" />
                Historial de pieza
              </p>
              {selectedTooth && selectedSavedHistory.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedSavedHistory.map((item, index) => (
                    <div
                      key={`${item.fecha}-${index}`}
                      className="rounded-xl border border-[#bec8ce] p-3 bg-[#f9f9ff]"
                    >
                      <p className="text-xs text-[#bec8ce]">{item.fecha}</p>
                      <p className="text-sm font-semibold text-[#151c27]">
                        {item.tipo}
                      </p>
                      <p className="text-sm text-[#3f484e]">{item.detalle}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#bec8ce] rounded-xl border border-dashed border-[#bec8ce] p-4 bg-[#f9f9ff]">
                  {selectedTooth
                    ? "Esta pieza no tiene historial guardado todavía."
                    : "Selecciona una pieza para consultar su historial guardado."}
                </div>
              )}
            </div>
          </div>

          {selectedTooth && (
            <div className="mt-4 bg-white border border-[#bec8ce] rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#151c27] mb-2">
                Observación de la pieza {selectedTooth}
              </p>
              <p className="text-sm text-[#3f484e] whitespace-pre-wrap">
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
