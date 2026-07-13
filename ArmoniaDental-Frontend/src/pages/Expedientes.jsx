import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ModalSubirDocumento from "../components/ModalSubirDocumento";
import ModalConfirmarEliminar from "../components/ModalConfirmarEliminar";
import {
  obtenerPacientesConExpediente,
  obtenerPacientePorId,
  obtenerExpedientesPorPaciente,
  obtenerHistoriaClinica,
} from "../services/pacienteService";
import { getCitasAtendidasPorPaciente } from "../services/citaService";
import {
  obtenerDocumentosPorExpediente,
  getUrlDescarga,
  getUrlVer,
  eliminarDocumento,
} from "../services/documentoExpedienteService";
import VisorPDF from "../components/VisorPDF";
import ModalHistoriaClinica from "../components/ModalHistoriaClinica";
import FichaHistoriaClinica from "../components/FichaHistoriaClinica";

const getInitials = (nombre = "") =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const getIconoFormato = (formato = "") => {
  if (formato === "pdf") return "picture_as_pdf";
  if (["doc", "docx"].includes(formato)) return "description";
  if (["jpg", "jpeg", "png"].includes(formato)) return "image";
  return "draft";
};

const formatearFechaSubida = (fecha) =>
  new Date(fecha).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatearFecha = (fecha) => {
  if (!fecha) return null;
  return new Date(
    new Date(fecha).toISOString().split("T")[0] + "T12:00:00",
  ).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const renderBadges = (items, color) => {
  if (!items) return <span className="text-xs text-[#bec8ce]">Ninguna</span>;
  const arr = Array.isArray(items) ? items : [items];
  if (arr.length === 0 || arr.includes("Ninguna"))
    return <span className="text-xs text-[#bec8ce]">Ninguna</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {arr.map((item) => (
        <span
          key={item}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

const Expedientes = () => {
  // ── Pacientes ──
  const [pacientes, setPacientes] = useState([]);
  const [cargandoPacientes, setCargandoPacientes] = useState(true);
  const [errorPacientes, setErrorPacientes] = useState(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [pacientesMostrados, setPacientesMostrados] = useState(5);

  // ── Detalle completo del paciente ──
  const [detallePaciente, setDetallePaciente] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // ── Atenciones (historial de expedientes) ──
  const [atenciones, setAtenciones] = useState([]);
  const [cargandoAtenciones, setCargandoAtenciones] = useState(false);
  const [errorAtenciones, setErrorAtenciones] = useState(null);

  // ── Citas atendidas ──
  const [citasAtendidas, setCitasAtendidas] = useState([]);

  // ── Historia clínica ──
  const [historiaClinica, setHistoriaClinica] = useState(null);
  const [cargandoHistoria, setCargandoHistoria] = useState(false);
  const [mostrarModalHistoria, setMostrarModalHistoria] = useState(false);

  // ── Documentos ──
  const [documentos, setDocumentos] = useState([]);
  const [cargandoDocs, setCargandoDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState(null);
  const [mostrarModalSubida, setMostrarModalSubida] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [docAEliminar, setDocAEliminar] = useState(null);
  const [pdfSeleccionado, setPdfSeleccionado] = useState(null);

  // ── Toast de Error para Docuemntos Locales ──
  const [toastError, setToastError] = useState(null);

  // ── Toast Error ──
  const mostrarToastError = (mensaje) => {
    setToastError(mensaje);
    setTimeout(() => setToastError(null), 3500);
  };

  // ── Cargar pacientes al montar ──
  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      setCargandoPacientes(true);
      setErrorPacientes(null);
      const respuesta = await obtenerPacientesConExpediente();
      setPacientes(Array.isArray(respuesta?.data) ? respuesta.data : []);
    } catch (err) {
      setErrorPacientes(err.message || "No se pudieron cargar los pacientes.");
      setPacientes([]);
    } finally {
      setCargandoPacientes(false);
    }
  };

  const pacientesFiltrados = pacientes.filter((p) => {
    const t = busqueda.toLowerCase();
    return p.nombre?.toLowerCase().includes(t) || p.cedula?.includes(busqueda);
  });

  const pacientesAMostrar = pacientesFiltrados.slice(0, pacientesMostrados);
  const hayMas = pacientesFiltrados.length > pacientesMostrados;

  // ── Cargar detalle completo ──
  useEffect(() => {
    const cargarDetalle = async () => {
      if (!pacienteSeleccionado?._id) {
        setDetallePaciente(null);
        return;
      }
      try {
        setCargandoDetalle(true);
        const respuesta = await obtenerPacientePorId(pacienteSeleccionado._id);
        setDetallePaciente(respuesta.data);
      } catch {
        setDetallePaciente(null);
      } finally {
        setCargandoDetalle(false);
      }
    };
    cargarDetalle();
  }, [pacienteSeleccionado]);

  // ── Cargar atenciones ──
  useEffect(() => {
    const cargarAtenciones = async () => {
      if (!pacienteSeleccionado?._id) {
        setAtenciones([]);
        return;
      }
      try {
        setCargandoAtenciones(true);
        setErrorAtenciones(null);
        const respuesta = await obtenerExpedientesPorPaciente(
          pacienteSeleccionado._id,
        );
        setAtenciones(respuesta.data || []);
      } catch (err) {
        setErrorAtenciones(err.message || "No se pudo cargar el historial.");
        setAtenciones([]);
      } finally {
        setCargandoAtenciones(false);
      }
    };
    cargarAtenciones();
  }, [pacienteSeleccionado]);

  // ── Cargar citas atendidas ──
  useEffect(() => {
    const cargarCitasAtendidas = async () => {
      if (!pacienteSeleccionado?._id) {
        setCitasAtendidas([]);
        return;
      }
      try {
        const respuesta = await getCitasAtendidasPorPaciente(
          pacienteSeleccionado._id,
        );
        setCitasAtendidas(respuesta.data || []);
      } catch {
        setCitasAtendidas([]);
      }
    };
    cargarCitasAtendidas();
  }, [pacienteSeleccionado]);

  // ── Cargar historia clínica ──
  useEffect(() => {
    const cargarHistoria = async () => {
      if (!pacienteSeleccionado?._id) {
        setHistoriaClinica(null);
        return;
      }
      try {
        setCargandoHistoria(true);
        const respuesta = await obtenerHistoriaClinica(
          pacienteSeleccionado._id,
        );
        setHistoriaClinica(respuesta.data || null);
      } catch {
        setHistoriaClinica(null);
      } finally {
        setCargandoHistoria(false);
      }
    };
    cargarHistoria();
  }, [pacienteSeleccionado]);

  const handleHistoriaGuardada = (nuevaHistoria) => {
    setHistoriaClinica(nuevaHistoria);
    setMostrarModalHistoria(false);
  };

  // ── Cargar documentos ──
  useEffect(() => {
    const cargarDocumentos = async () => {
      if (!pacienteSeleccionado?.expediente_id) {
        setDocumentos([]);
        return;
      }
      try {
        setCargandoDocs(true);
        setErrorDocs(null);
        const respuesta = await obtenerDocumentosPorExpediente(
          pacienteSeleccionado.expediente_id,
        );
        setDocumentos(respuesta.data || []);
      } catch (err) {
        setErrorDocs(err.message || "No se pudieron cargar los documentos.");
      } finally {
        setCargandoDocs(false);
      }
    };
    cargarDocumentos();
  }, [pacienteSeleccionado]);

  const handleDocumentoSubido = (nuevoDocumento) => {
    setDocumentos((prev) => [nuevoDocumento, ...prev]);
  };

  const handleAnotacionesGuardadas = (documentoId, nuevasAnotaciones) => {
    setDocumentos((prev) =>
      prev.map((d) =>
        d._id === documentoId ? { ...d, anotaciones: nuevasAnotaciones } : d,
      ),
    );
  };

  const confirmarEliminarDocumento = async () => {
    if (!docAEliminar) return;
    try {
      setEliminandoId(docAEliminar);
      await eliminarDocumento(docAEliminar);
      setDocumentos((prev) => prev.filter((d) => d._id !== docAEliminar));
    } catch (err) {
      alert(err.message || "No se pudo eliminar el documento.");
    } finally {
      setEliminandoId(null);
      setDocAEliminar(null);
    }
  };

  // ── Historial completo mezclado y ordenado ──
  const historialCompleto = [
    ...atenciones.map((a) => ({ ...a, _fuente: "expediente" })),
    ...citasAtendidas.map((c) => ({
      _id: c._id,
      _fuente: "cita",
      fecha: c.fecha_hora,
      tipo: c.tipo,
      descripcion: c.motivo,
      tratamiento: null,
      proximo_control: null,
    })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="expedientes" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
              Expediente Clínico
            </h2>
            <p className="text-sm text-[#3f484e] mt-1">
              Historial médico de los pacientes de la clínica
            </p>
          </div>

          <div className="grid lg:grid-cols-7 gap-5">
            {/* ── Lista de pacientes ── */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-[#bec8ce] rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-[#151c27] flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#006686] text-[20px]">
                    stethoscope
                  </span>
                  Pacientes
                  <span className="ml-auto text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] px-2 py-0.5 rounded-full">
                    {pacientesFiltrados.length}
                  </span>
                </h3>

                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e] text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                  />
                </div>

                {cargandoPacientes ? (
                  <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-md text-[#006686]" />
                  </div>
                ) : errorPacientes ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-3xl text-[#ba1a1a] block mb-2">
                      error
                    </span>
                    <p className="text-sm text-[#ba1a1a] mb-2">
                      {errorPacientes}
                    </p>
                    <button
                      onClick={cargarPacientes}
                      className="text-xs font-semibold text-[#006686] underline"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : pacientesAMostrar.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">
                      person_search
                    </span>
                    <p className="text-sm text-[#3f484e]">
                      No se encontraron pacientes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pacientesAMostrar.map((paciente) => (
                      <button
                        key={paciente._id}
                        onClick={() => setPacienteSeleccionado(paciente)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          pacienteSeleccionado?._id === paciente._id
                            ? "bg-[#7dd3fc20] border-[#006686] border-l-4"
                            : "border-[#bec8ce] hover:bg-[#f0f3ff] hover:border-[#006686]/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-xs flex-shrink-0">
                            {getInitials(paciente.nombre)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold text-[#151c27] text-sm truncate">
                                {paciente.nombre}
                              </p>
                              {!paciente.activo && (
                                <span className="text-[10px] font-bold text-[#ba1a1a] bg-[#ffdad6] px-1.5 py-0.5 rounded-full ml-1">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#3f484e]">
                              Cédula: {paciente.cedula || "No registrada"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}

                    {hayMas && (
                      <button
                        onClick={() => setPacientesMostrados((p) => p + 5)}
                        className="w-full py-2.5 text-xs font-semibold text-[#006686] border border-[#006686]/30 rounded-xl hover:bg-[#7dd3fc20] transition-colors flex items-center justify-center gap-1 mt-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          expand_more
                        </span>
                        Ver más (
                        {pacientesFiltrados.length - pacientesMostrados}{" "}
                        restantes)
                      </button>
                    )}

                    {pacientesMostrados > 5 && !hayMas && (
                      <button
                        onClick={() => setPacientesMostrados(5)}
                        className="w-full py-2.5 text-xs font-semibold text-[#3f484e] border border-[#bec8ce] rounded-xl hover:bg-[#f0f3ff] transition-colors flex items-center justify-center gap-1 mt-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          expand_less
                        </span>
                        Ver menos
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Detalle del expediente ── */}
            <div className="lg:col-span-5">
              {pacienteSeleccionado ? (
                <div className="space-y-5">
                  {/* Info del paciente */}
                  <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#7dd3fc20] border-2 border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-lg">
                          {getInitials(pacienteSeleccionado.nombre)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-[#151c27]">
                            {pacienteSeleccionado.nombre}
                          </h3>
                          <p className="text-xs text-[#3f484e]">
                            Cédula:{" "}
                            {pacienteSeleccionado.cedula || "No registrada"}
                          </p>
                        </div>
                      </div>
                      {pacienteSeleccionado.activo ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#6df5e120] text-[#006b5f] border border-[#6df5e1]/30">
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20">
                          Inactivo
                        </span>
                      )}
                    </div>

                    {cargandoDetalle ? (
                      <div className="flex justify-center py-4">
                        <span className="loading loading-spinner loading-sm text-[#006686]" />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          {[
                            {
                              label: "Teléfono",
                              value: detallePaciente?.telefono || "—",
                            },
                            {
                              label: "Correo",
                              value: detallePaciente?.correo || "—",
                            },
                            {
                              label: "Fecha de nacimiento",
                              value:
                                formatearFecha(
                                  detallePaciente?.fecha_nacimiento,
                                ) || "—",
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-3"
                            >
                              <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-1">
                                {item.label}
                              </p>
                              <p className="text-xs font-semibold text-[#151c27]">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-2">
                              Alergias
                            </p>
                            {renderBadges(
                              detallePaciente?.alergias,
                              "bg-[#ffddb820] text-[#855300] border-[#855300]/20",
                            )}
                          </div>
                          <div className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-2">
                              Enfermedades relevantes
                            </p>
                            {renderBadges(
                              detallePaciente?.enfermedades,
                              "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20",
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── Historia clínica ── */}
                  {cargandoHistoria ? (
                    <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm flex justify-center py-8">
                      <span className="loading loading-spinner loading-md text-[#006686]" />
                    </div>
                  ) : (
                    <FichaHistoriaClinica
                      historia={historiaClinica}
                      onEditar={() => setMostrarModalHistoria(true)}
                      onRegistrar={() => setMostrarModalHistoria(true)}
                    />
                  )}

                  {/* ── Documentos ── */}
                  <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-semibold text-[#151c27] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006686] text-[20px]">
                          folder_open
                        </span>
                        Documentos
                      </h3>
                      <button
                        onClick={() => setMostrarModalSubida(true)}
                        disabled={!pacienteSeleccionado.expediente_id}
                        className="px-4 py-2 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40"
                        title={
                          !pacienteSeleccionado.expediente_id
                            ? "Este paciente no tiene expediente activo"
                            : ""
                        }
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          add
                        </span>
                        Añadir documento
                      </button>
                    </div>

                    {cargandoDocs ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md text-[#006686]" />
                      </div>
                    ) : errorDocs ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#ba1a1a]">
                        <span className="material-symbols-outlined text-[18px]">
                          error
                        </span>
                        {errorDocs}
                      </div>
                    ) : documentos.length === 0 ? (
                      <div className="text-center py-10">
                        <span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">
                          description
                        </span>
                        <p className="text-sm text-[#3f484e]">
                          No hay documentos adjuntos en este expediente
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {documentos.map((doc) => (
                          <div
                            key={doc._id}
                            className="flex items-center gap-3 border border-[#bec8ce] rounded-xl p-3 hover:border-[#006686]/30 hover:shadow-sm transition-all"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[#f0f3ff] flex items-center justify-center text-[#006686] flex-shrink-0">
                              <span className="material-symbols-outlined text-[20px]">
                                {getIconoFormato(doc.formato)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              {["pdf", "jpg", "jpeg", "png"].includes(
                                doc.formato,
                              ) ? (
                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(
                                        getUrlVer(doc._id),
                                      );
                                      if (!response.ok) {
                                        const data = await response.json();
                                        mostrarToastError(
                                          data.message ||
                                            "El archivo no se encuentra en el servidor.",
                                        );
                                        return;
                                      }
                                      setPdfSeleccionado(doc);
                                    } catch {
                                      mostrarToastError(
                                        "No se pudo acceder al archivo.",
                                      );
                                    }
                                  }}
                                  className="text-sm font-semibold text-[#151c27] text-left hover:text-[#006686] hover:underline w-full truncate block"
                                >
                                  {doc.nombre_original}
                                </button>
                              ) : (
                                <p className="text-sm font-semibold text-[#151c27] truncate w-full">
                                  {doc.nombre_original}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#dce2f3] text-[#3f484e]">
                                  {doc.tipo}
                                </span>
                                <span className="text-[10px] text-[#3f484e]">
                                  {formatearFechaSubida(
                                    doc.fecha_subida || doc.createdAt,
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("token");
                                    const headers = token
                                      ? { Authorization: `Bearer ${token}` }
                                      : {};
                                    const response = await fetch(
                                      getUrlVer(doc._id),
                                      {
                                        credentials: "include",
                                        headers,
                                      },
                                    );
                                    if (!response.ok) {
                                      try {
                                        const data = await response.json();
                                        mostrarToastError(
                                          data.message ||
                                            "El archivo no se encuentra en el servidor.",
                                        );
                                      } catch {
                                        mostrarToastError(
                                          "El archivo no se encuentra en el servidor.",
                                        );
                                      }
                                      return;
                                    }
                                    setPdfSeleccionado(doc);
                                  } catch {
                                    mostrarToastError(
                                      "No se pudo acceder al archivo.",
                                    );
                                  }
                                }}
                                className="p-1.5 rounded text-[#3f484e] hover:bg-[#f0f3ff] hover:text-[#006686] transition-colors"
                                title="Descargar"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  download
                                </span>
                              </button>
                              <button
                                onClick={() => setDocAEliminar(doc._id)}
                                disabled={eliminandoId === doc._id}
                                className="p-1.5 rounded text-[#3f484e] hover:bg-[#ffdad6]/40 hover:text-[#ba1a1a] transition-colors disabled:opacity-40"
                                title="Eliminar"
                              >
                                {eliminandoId === doc._id ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : (
                                  <span className="material-symbols-outlined text-[18px]">
                                    delete
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Historial de atenciones ── */}
                  <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006686] text-[20px]">
                        history
                      </span>
                      Historial de Atenciones
                    </h3>

                    {cargandoAtenciones ? (
                      <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-md text-[#006686]" />
                      </div>
                    ) : errorAtenciones ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#ba1a1a]">
                        <span className="material-symbols-outlined text-[18px]">
                          error
                        </span>
                        {errorAtenciones}
                      </div>
                    ) : historialCompleto.length === 0 ? (
                      <div className="text-center py-12">
                        <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                          folder_open
                        </span>
                        <p className="text-sm text-[#3f484e]">
                          No hay registros de atenciones aún
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {historialCompleto.map((item) => (
                          <div
                            key={item._id}
                            className="border border-[#bec8ce] rounded-xl p-4 hover:shadow-sm hover:border-[#006686]/30 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {item.tipo && (
                                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#dce2f3] text-[#3f484e] border border-[#bec8ce]">
                                    {item.tipo}
                                  </span>
                                )}
                                {item._fuente === "cita" && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#7dd3fc20] text-[#006686] border border-[#006686]/20">
                                    Cita
                                  </span>
                                )}
                                <span className="text-xs text-[#3f484e]">
                                  {formatearFecha(item.fecha) || "Sin fecha"}
                                </span>
                              </div>
                            </div>
                            {item.descripcion && (
                              <p className="text-sm text-[#151c27] mb-2">
                                {item.descripcion}
                              </p>
                            )}
                            {item.tratamiento && (
                              <p className="text-sm font-semibold text-[#006686]">
                                Tratamiento: {item.tratamiento}
                              </p>
                            )}
                            {item.proximo_control && (
                              <p className="text-xs text-[#3f484e] mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  event
                                </span>
                                Próximo control:{" "}
                                {formatearFecha(item.proximo_control)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#bec8ce] rounded-xl p-16 text-center shadow-sm h-full flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-[#bec8ce] block mb-4">
                    stethoscope
                  </span>
                  <p className="text-base font-semibold text-[#3f484e]">
                    Seleccione un paciente para ver su expediente
                  </p>
                  <p className="text-xs text-[#bec8ce] mt-1">
                    Puede buscar por nombre o cédula en la lista de la izquierda
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {mostrarModalHistoria && pacienteSeleccionado && (
        <ModalHistoriaClinica
          pacienteId={pacienteSeleccionado._id}
          historiaExistente={historiaClinica}
          onClose={() => setMostrarModalHistoria(false)}
          onGuardado={handleHistoriaGuardada}
        />
      )}

      {mostrarModalSubida && pacienteSeleccionado && (
        <ModalSubirDocumento
          expedienteId={pacienteSeleccionado.expediente_id}
          pacienteId={pacienteSeleccionado._id}
          onClose={() => setMostrarModalSubida(false)}
          onSubido={handleDocumentoSubido}
        />
      )}

      {pdfSeleccionado && (
        <VisorPDF
          documento={pdfSeleccionado}
          urlVer={getUrlVer(pdfSeleccionado._id)}
          urlDescarga={getUrlDescarga(pdfSeleccionado._id)}
          onClose={() => setPdfSeleccionado(null)}
          onAnotacionesGuardadas={handleAnotacionesGuardadas}
        />
      )}

      <ModalConfirmarEliminar
        open={!!docAEliminar}
        titulo="Eliminar documento"
        mensaje="¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer."
        eliminando={!!eliminandoId}
        onConfirmar={confirmarEliminarDocumento}
        onCancelar={() => setDocAEliminar(null)}
      />
      {toastError && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white border border-[#ba1a1a]/30 rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
            <div className="bg-[#ffdad6] p-3 rounded-xl flex-shrink-0">
              <span className="material-symbols-outlined text-[#ba1a1a]">
                error
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#151c27]">
                Archivo no disponible
              </p>
              <p className="text-xs text-[#3f484e] mt-0.5">{toastError}</p>
            </div>
            <button
              onClick={() => setToastError(null)}
              className="text-[#bec8ce] hover:text-[#3f484e] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expedientes;
