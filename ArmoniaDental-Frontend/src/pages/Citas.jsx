import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  getCitas,
  createCita,
  updateCita,
  cancelarCita,
  getPacientes,
  getUsuarios,
  getDisponibilidad,
} from "../services/citaService";

const DURACIONES = {
  Limpieza: 45,
  Revisión: 30,
  Cirugía: 120,
  Blanqueamiento: 60,
  Ortodoncia: 30,
  Empaste: 60,
  Radiografía: 20,
};

const ESTADOS = [
  "Programada",
  "Confirmada",
  "En atención",
  "Atendida",
  "Cancelada",
  "No asistió",
];
const TIPOS = [
  "Limpieza",
  "Revisión",
  "Cirugía",
  "Blanqueamiento",
  "Ortodoncia",
  "Empaste",
  "Radiografía",
];

const BADGE_ESTADO = {
  Cancelada: "bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/20",
  Atendida: "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/30",
  Programada: "bg-[#ffddb820] text-[#855300] border-[#855300]/20",
  Confirmada: "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20",
  "En atención": "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]",
  "No asistió": "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]",
};

// Colores sólidos por estado, usados para las tarjetas dentro de las celdas del calendario
const DOT_ESTADO = {
  Cancelada: "#ba1a1a",
  Atendida: "#006b5f",
  Programada: "#855300",
  Confirmada: "#006686",
  "En atención": "#3f484e",
  "No asistió": "#3f484e",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const inputCls =
  "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]";

// Claves de fecha en hora LOCAL (evita el corrimiento de día que provoca toISOString en UTC)
const claveFechaLocal = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [vista, setVista] = useState("calendario"); // "lista" | "calendario"

  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [mostrarPasadas, setMostrarPasadas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [citaEditando, setCitaEditando] = useState(null);

  // Estado del calendario mensual
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [diaExpandido, setDiaExpandido] = useState(null); // clave "YYYY-MM-DD" del día con popover de "+N más"

  const [formNueva, setFormNueva] = useState({
    paciente_id: "",
    usuario_id: "",
    fecha_hora: "",
    tipo: "Revisión",
    motivo: "",
    observaciones: "",
  });
  const [formEditar, setFormEditar] = useState({
    fecha_hora: "",
    tipo: "",
    estado: "",
    observaciones: "",
    motivo: "",
  });

  const mostrarError = (msg) => {
    setMensajeError(msg);
    setTimeout(() => setMensajeError(""), 4000);
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [citasData, pacientesData, usuariosData] = await Promise.all([
          getCitas({ pasadas: "true" }),
          getPacientes(),
          getUsuarios(),
        ]);
        setCitas(citasData);
        setPacientes(pacientesData);
        setUsuarios(usuariosData);
        if (usuariosData.length > 0)
          setFormNueva((p) => ({ ...p, usuario_id: usuariosData[0]._id }));
      } catch (err) {
        mostrarError("Error al cargar los datos: " + err.message);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    const cargarDisponibilidad = async () => {
      if (!fechaSeleccionada || !formNueva.tipo) {
        setHorariosDisponibles([]);
        return;
      }

      try {
        setCargandoHorarios(true);

        const data = await getDisponibilidad(
          fechaSeleccionada,
          formNueva.tipo
        );

        setHorariosDisponibles(data);
      } catch (error) {
        console.error(error);
      } finally {
        setCargandoHorarios(false);
      }
    };

    cargarDisponibilidad();
  }, [fechaSeleccionada, formNueva.tipo]);

  const formatearFecha = (f) =>
    new Date(f).toLocaleString("es-CR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatearHora = (f) =>
    new Date(f).toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  // Hora compacta (24h, sin "a. m./p. m.") para que entre en las celdas angostas del calendario
  const formatearHoraCompacta = (f) => {
    const d = new Date(f);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  // Solo el primer nombre, para que las tarjetas de las celdas del calendario no se corten
  const primerNombre = (nombreCompleto) => {
    if (!nombreCompleto) return "Sin paciente";
    return nombreCompleto.trim().split(" ")[0];
  };

  const toInputDateTime = (f) => {
    if (!f) return "";
    const d = new Date(f);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const handleCrear = async (e) => {
    e.preventDefault();

    if (!formNueva.fecha_hora) {
      mostrarError("Debes seleccionar un horario disponible.");
      return;
    }

    setGuardando(true);
    setMensajeError("");

    try {
      const nueva = await createCita(formNueva);
      setCitas((p) => [...p, nueva]);

      setFormNueva({
        paciente_id: "",
        usuario_id: formNueva.usuario_id,
        fecha_hora: "",
        tipo: "Revisión",
        motivo: "",
        observaciones: "",
      });

      setFechaSeleccionada("");
      setHorariosDisponibles([]);
    } catch (err) {
      mostrarError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEditar = (cita) => {
    setCitaEditando(cita);
    setFormEditar({
      fecha_hora: toInputDateTime(cita.fecha_hora),
      tipo: cita.tipo,
      estado: cita.estado,
      observaciones: cita.observaciones || "",
      motivo: cita.motivo || "",
    });
    setDiaExpandido(null);
    setMostrarModal(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeError("");
    try {
      const actualizada = await updateCita(citaEditando._id, formEditar);
      setCitas((p) =>
        p.map((c) => (c._id === actualizada._id ? actualizada : c)),
      );
      setMostrarModal(false);
      setCitaEditando(null);
    } catch (err) {
      mostrarError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarCita = async (id) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    try {
      await cancelarCita(id);
      setCitas((p) =>
        p.map((c) => (c._id === id ? { ...c, estado: "Cancelada" } : c)),
      );
    } catch (err) {
      mostrarError(err.message);
    }
  };

  const citasOrdenadas = useMemo(() => {
    const ahora = Date.now();
    return [...citas].sort((a, b) => {
      const fa = new Date(a.fecha_hora).getTime();
      const fb = new Date(b.fecha_hora).getTime();
      const futA = fa >= ahora,
        futB = fb >= ahora;
      if (futA === futB) return fa - fb;
      return futB ? 1 : -1;
    });
  }, [citas]);

  const citasFiltradas = useMemo(() => {
    const ahora = new Date();
    return citasOrdenadas.filter((c) => {
      const fecha = new Date(c.fecha_hora);
      // Un día específico elegido (clic en el calendario o filtro manual) siempre se respeta,
      // incluso si ya pasó, para que el clic en el número del día nunca devuelva una lista vacía.
      if (!mostrarPasadas && !filtroFecha && fecha < ahora) return false;
      if (filtroFecha && claveFechaLocal(fecha) !== filtroFecha) return false;
      if (filtroEstado && c.estado !== filtroEstado) return false;
      if (filtroTipo && c.tipo !== filtroTipo) return false;
      // Sincronizado con el mes/año activo del calendario (salvo que haya un día específico filtrado)
      if (
        !filtroFecha &&
        (fecha.getMonth() !== mesActual || fecha.getFullYear() !== anioActual)
      )
        return false;
      return true;
    });
  }, [
    citasOrdenadas,
    mostrarPasadas,
    filtroFecha,
    filtroEstado,
    filtroTipo,
    mesActual,
    anioActual,
  ]);

  // Citas agrupadas por día (clave local), respetando los mismos filtros de estado/tipo/pasadas que la lista
  const citasPorDia = useMemo(() => {
    const ahora = new Date();
    const mapa = {};
    citas.forEach((c) => {
      if (filtroEstado && c.estado !== filtroEstado) return;
      if (filtroTipo && c.tipo !== filtroTipo) return;
      const fecha = new Date(c.fecha_hora);
      if (!mostrarPasadas && fecha < ahora) return;
      const clave = claveFechaLocal(fecha);
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(c);
    });
    Object.values(mapa).forEach((arr) =>
      arr.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)),
    );
    return mapa;
  }, [citas, filtroEstado, filtroTipo, mostrarPasadas]);

  // Construcción de la cuadrícula del mes (semanas que inician en lunes)
  const celdasMes = useMemo(() => {
    const primerDia = new Date(anioActual, mesActual, 1);
    const offsetInicio = (primerDia.getDay() + 6) % 7; // 0 = lunes
    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const totalCeldas = Math.ceil((offsetInicio + diasEnMes) / 7) * 7;

    const celdas = [];
    for (let i = 0; i < totalCeldas; i++) {
      const numeroDia = i - offsetInicio + 1;
      const fecha = new Date(anioActual, mesActual, numeroDia);
      celdas.push({
        fecha,
        clave: claveFechaLocal(fecha),
        enMesActual: numeroDia >= 1 && numeroDia <= diasEnMes,
      });
    }
    return celdas;
  }, [mesActual, anioActual]);

  const irMesAnterior = () => {
    setDiaExpandido(null);
    setFiltroFecha("");
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual((a) => a - 1);
    } else {
      setMesActual((m) => m - 1);
    }
  };

  const irMesSiguiente = () => {
    setDiaExpandido(null);
    setFiltroFecha("");
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual((a) => a + 1);
    } else {
      setMesActual((m) => m + 1);
    }
  };

  const irMesHoy = () => {
    setDiaExpandido(null);
    setFiltroFecha("");
    setMesActual(hoy.getMonth());
    setAnioActual(hoy.getFullYear());
  };

  const claveHoy = claveFechaLocal(hoy);
  const MAX_VISIBLES = 3;

  if (cargando)
    return (
      <div className="flex overflow-hidden h-screen bg-[#f9f9ff]">
        <Sidebar activeItem="citas" />
        <main className="flex-1 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-[#006686]" />
        </main>
      </div>
    );

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="citas" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                Agenda de Citas
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Programa y controla limpiezas, cirugías, revisiones y
                blanqueamientos
              </p>
            </div>

            {/* Toggle Lista / Calendario */}
            <div className="flex items-center gap-1 bg-[#f0f3ff] border border-[#bec8ce] rounded-full p-1 w-fit">
              <button
                onClick={() => setVista("lista")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  vista === "lista"
                    ? "bg-[#006686] text-white shadow-sm"
                    : "text-[#3f484e] hover:text-[#006686]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  format_list_bulleted
                </span>
                Lista
              </button>
              <button
                onClick={() => setVista("calendario")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  vista === "calendario"
                    ? "bg-[#006686] text-white shadow-sm"
                    : "text-[#3f484e] hover:text-[#006686]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  calendar_month
                </span>
                Calendario
              </button>
            </div>
          </div>

          {mensajeError && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-5 py-3 flex items-center gap-3 mb-5 text-sm text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>
              {mensajeError}
            </div>
          )}

          <div className="grid lg:grid-cols-[2fr,3fr] gap-6">
            {/* ── Formulario nueva cita ── */}
            <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm h-fit">
              <h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006686] text-[20px]">
                  add_circle
                </span>
                Nueva Cita
              </h3>

              <form
                className="space-y-4"
                onSubmit={handleCrear}
                autoComplete="off"
              >
                <div>
                  <Label>Paciente *</Label>
                  <select
                    name="paciente_id"
                    value={formNueva.paciente_id}
                    onChange={(e) =>
                      setFormNueva((p) => ({
                        ...p,
                        paciente_id: e.target.value,
                      }))
                    }
                    required
                    className={inputCls}
                  >
                    <option value="">Seleccionar paciente</option>
                    {pacientes.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Doctor(a) *</Label>
                    {usuarios.length === 0 ? (
                      <div className="px-4 py-2.5 border border-dashed border-[#bec8ce] rounded-lg text-sm text-[#3f484e] bg-[#f9f9ff]">
                        No hay doctores disponibles
                      </div>
                    ) : (
                      <select
                        name="usuario_id"
                        value={formNueva.usuario_id}
                        onChange={(e) =>
                          setFormNueva((p) => ({
                            ...p,
                            usuario_id: e.target.value,
                          }))
                        }
                        required
                        className={inputCls}
                      >
                        <option value="" disabled>
                          Seleccionar doctor(a)
                        </option>
                        {usuarios.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <Label>Tipo de cita *</Label>
                    <select
                      name="tipo"
                      value={formNueva.tipo}
                      onChange={(e) =>
                        setFormNueva((p) => ({ ...p, tipo: e.target.value }))
                      }
                      required
                      className={inputCls}
                    >
                      {TIPOS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Fecha *</Label>

                      <input
                        type="date"
                        value={fechaSeleccionada}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                          setFechaSeleccionada(e.target.value);

                          setFormNueva((p) => ({
                            ...p,
                            fecha_hora: "",
                          }));
                        }}
                        className={inputCls}
                        required
                      />
                    </div>

                    <div>
                      <Label>Duración estimada</Label>

                      <input
                        type="text"
                        value={`${DURACIONES[formNueva.tipo] || 30} minutos`}
                        disabled
                        className={`${inputCls} bg-[#f0f3ff] cursor-not-allowed`}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Horarios disponibles *</Label>

                    {!fechaSeleccionada ? (
                      <div className="rounded-lg border border-dashed border-[#bec8ce] bg-[#f9f9ff] px-4 py-4 text-sm text-[#3f484e]">
                        Selecciona una fecha para ver los horarios disponibles.
                      </div>
                    ) : cargandoHorarios ? (
                      <div className="rounded-lg border border-[#bec8ce] bg-[#f9f9ff] py-5 text-center">
                        <span className="loading loading-spinner loading-md text-[#006686]" />
                      </div>
                    ) : horariosDisponibles.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[#bec8ce] bg-[#f9f9ff] px-4 py-4 text-sm text-[#3f484e]">
                        No hay horarios disponibles para esta fecha.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                        {horariosDisponibles.map((slot) => {
                          const hora = formatearHora(slot.fecha_hora);

                          const seleccionado =
                            new Date(formNueva.fecha_hora).getTime() ===
                            new Date(slot.fecha_hora).getTime();

                          return (
                            <button
                              key={slot.fecha_hora}
                              type="button"
                              disabled={!slot.disponible}
                              onClick={() =>
                                setFormNueva((p) => ({
                                  ...p,
                                  fecha_hora: slot.fecha_hora,
                                }))
                              }
                              className={`
                                rounded-lg border px-3 py-2 text-xs font-semibold transition-all

                                ${
                                  seleccionado
                                    ? "border-[#006686] bg-[#006686] text-white shadow-sm"
                                    : ""
                                }

                                ${
                                  !slot.disponible
                                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-70"
                                    : !seleccionado
                                      ? "border-[#bec8ce] bg-white text-[#3f484e] hover:border-[#006686] hover:bg-[#f0f3ff] hover:text-[#006686]"
                                      : ""
                                }
                              `}
                            >
                              {hora}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {formNueva.fecha_hora && (
                      <p className="mt-2 text-xs text-[#006686] font-semibold">
                        Hora seleccionada: {formatearHora(formNueva.fecha_hora)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Motivo *</Label>
                  <textarea
                    name="motivo"
                    value={formNueva.motivo}
                    onChange={(e) =>
                      setFormNueva((p) => ({ ...p, motivo: e.target.value }))
                    }
                    placeholder="Describa el motivo de la cita"
                    required
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div>
                  <Label>Observaciones</Label>
                  <textarea
                    name="observaciones"
                    value={formNueva.observaciones}
                    onChange={(e) =>
                      setFormNueva((p) => ({
                        ...p,
                        observaciones: e.target.value,
                      }))
                    }
                    placeholder="Observaciones adicionales (opcional)"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                  >
                    {guardando ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">
                          check
                        </span>
                        Crear Cita
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Vista Lista o Calendario ── */}
            <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm flex flex-col gap-4">
              {/* ── Encabezado compartido: navegación de mes + filtros ── */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-[#151c27] capitalize min-w-[160px]">
                    {MESES[mesActual]} {anioActual}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={irMesAnterior}
                      className="p-1.5 rounded-lg border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors"
                      aria-label="Mes anterior"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      onClick={irMesHoy}
                      className="px-3 py-1.5 rounded-lg border border-[#bec8ce] text-xs font-semibold text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={irMesSiguiente}
                      className="p-1.5 rounded-lg border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors"
                      aria-label="Mes siguiente"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {vista === "lista" && (
                    <input
                      type="date"
                      value={filtroFecha}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setFiltroFecha(valor);
                        if (valor) {
                          const [anio, mes] = valor.split("-").map(Number);
                          setAnioActual(anio);
                          setMesActual(mes - 1);
                        }
                      }}
                      className="px-3 py-1.5 border border-[#bec8ce] rounded-lg text-xs focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
                    />
                  )}
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="px-3 py-1.5 border border-[#bec8ce] rounded-lg text-xs focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
                  >
                    <option value="">Estado</option>
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="px-3 py-1.5 border border-[#bec8ce] rounded-lg text-xs focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
                  >
                    <option value="">Tipo</option>
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {(filtroFecha || filtroEstado || filtroTipo) && (
                    <button
                      onClick={() => {
                        setFiltroFecha("");
                        setFiltroEstado("");
                        setFiltroTipo("");
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#3f484e] hover:bg-[#f0f3ff] rounded-lg transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative ${mostrarPasadas ? "bg-[#006686]" : "bg-[#bec8ce]"}`}
                  onClick={() => setMostrarPasadas((p) => !p)}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${mostrarPasadas ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </div>
                <span className="text-xs font-semibold text-[#3f484e]">
                  Mostrar citas pasadas de este mes
                </span>
              </label>

              {vista === "lista" ? (
                <>
                  {citasFiltradas.length === 0 ? (
                    <div className="text-center py-16">
                      <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                        calendar_today
                      </span>
                      <p className="text-sm text-[#3f484e]">
                        No hay citas para los filtros seleccionados.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {citasFiltradas.map((cita) => (
                        <div
                          key={cita._id}
                          className="border border-[#bec8ce] rounded-xl p-4 hover:shadow-md hover:border-[#006686]/30 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-[#3f484e]">
                                <span className="material-symbols-outlined text-[16px] text-[#006686]">
                                  schedule
                                </span>
                                <span>{formatearFecha(cita.fecha_hora)}</span>
                                <span className="text-[#bec8ce]">·</span>
                                <span>{DURACIONES[cita.tipo] || 30} min</span>
                              </div>
                              <p className="text-base font-semibold text-[#151c27]">
                                {cita.tipo} · {cita.motivo}
                              </p>
                              <p className="text-sm text-[#3f484e]">
                                {cita.paciente_id?.nombre}
                              </p>
                              <p className="text-xs text-[#3f484e]">
                                <span className="material-symbols-outlined text-[14px] align-middle mr-1">
                                  stethoscope
                                </span>
                                {cita.usuario_id?.nombre || "N/A"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${BADGE_ESTADO[cita.estado] || "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]"}`}
                              >
                                {cita.estado}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => abrirModalEditar(cita)}
                                  className="px-3 py-1 text-xs font-semibold border border-[#bec8ce] rounded-full text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleCancelarCita(cita._id)}
                                  disabled={cita.estado === "Cancelada"}
                                  className="px-3 py-1 text-xs font-semibold border border-[#bec8ce] rounded-full text-[#ba1a1a] hover:border-[#ba1a1a] hover:bg-[#ffdad6]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                          {cita.observaciones && (
                            <p className="mt-2 text-xs text-[#3f484e] bg-[#f0f3ff] rounded-lg p-2">
                              {cita.observaciones}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* ── Cuadrícula del calendario ── */}
                  <div className="border border-[#bec8ce] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-7 bg-[#f0f3ff] border-b border-[#bec8ce]">
                      {DIAS_SEMANA.map((d) => (
                        <div
                          key={d}
                          className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#3f484e]"
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7">
                      {celdasMes.map(({ fecha, clave, enMesActual }, indice) => {
                        const citasDelDia = citasPorDia[clave] || [];
                        const esHoy = clave === claveHoy;
                        const visibles = citasDelDia.slice(0, MAX_VISIBLES);
                        const restantes = citasDelDia.length - visibles.length;
                        const popoverAbierto = diaExpandido === clave;
                        const columna = indice % 7;
                        const fila = Math.floor(indice / 7);
                        const totalFilas = Math.ceil(celdasMes.length / 7);
                        const alinearDerecha = columna >= 5; // sáb/dom: abrir hacia la izquierda
                        const alinearArriba = fila >= totalFilas - 2; // últimas 2 filas: abrir hacia arriba

                        return (
                          <div
                            key={clave}
                            className={`relative min-h-[112px] border-b border-r border-[#bec8ce] p-1.5 flex flex-col gap-1 [&:nth-child(7n)]:border-r-0 ${
                              enMesActual ? "bg-white" : "bg-[#f9f9ff]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setFiltroFecha(clave);
                                setVista("lista");
                              }}
                              className={`text-xs font-semibold w-fit px-1.5 rounded-full hover:ring-2 hover:ring-[#006686]/40 transition-shadow ${
                                esHoy
                                  ? "bg-[#006686] text-white"
                                  : enMesActual
                                    ? "text-[#151c27]"
                                    : "text-[#bec8ce]"
                              }`}
                              title="Ver citas de este día en la lista"
                            >
                              {fecha.getDate()}
                            </button>

                            <div className="flex flex-col gap-1 overflow-hidden">
                              {visibles.map((cita) => (
                                <button
                                  key={cita._id}
                                  onClick={() => abrirModalEditar(cita)}
                                  className="text-left rounded-md border-l-2 px-1.5 py-1 text-[10px] leading-tight bg-[#f0f3ff] hover:bg-[#dce2f3] transition-colors"
                                  style={{
                                    borderLeftColor:
                                      DOT_ESTADO[cita.estado] || "#3f484e",
                                  }}
                                  title={`${formatearHora(cita.fecha_hora)} · ${cita.tipo} · ${cita.paciente_id?.nombre || "Sin paciente"}`}
                                >
                                  <span className="font-bold text-[#151c27]">
                                    {formatearHoraCompacta(cita.fecha_hora)}
                                  </span>{" "}
                                  <span className="text-[#3f484e] truncate">
                                    {primerNombre(cita.paciente_id?.nombre)}
                                  </span>
                                </button>
                              ))}

                              {restantes > 0 && (
                                <button
                                  onClick={() =>
                                    setDiaExpandido(
                                      popoverAbierto ? null : clave,
                                    )
                                  }
                                  className="text-left text-[10px] font-semibold text-[#006686] hover:underline px-1.5"
                                >
                                  +{restantes} más
                                </button>
                              )}
                            </div>

                            {popoverAbierto && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setDiaExpandido(null)}
                                />
                                <div
                                  className={`absolute z-40 w-44 bg-white border border-[#bec8ce] rounded-lg shadow-xl p-2 max-h-64 overflow-y-auto ${
                                    alinearDerecha ? "right-1" : "left-1"
                                  } ${alinearArriba ? "bottom-1" : "top-1"}`}
                                >
                                  <div className="flex items-center justify-between mb-1.5 px-1">
                                    <span className="text-[11px] font-bold text-[#151c27]">
                                      {fecha.toLocaleDateString("es-CR", {
                                        day: "2-digit",
                                        month: "short",
                                      })}
                                    </span>
                                    <button
                                      onClick={() => setDiaExpandido(null)}
                                      className="text-[#3f484e] hover:text-[#006686]"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        close
                                      </span>
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    {citasDelDia.map((cita) => (
                                      <button
                                        key={cita._id}
                                        onClick={() => abrirModalEditar(cita)}
                                        className="text-left rounded-md border-l-2 px-1.5 py-1 text-[10px] leading-tight bg-[#f0f3ff] hover:bg-[#dce2f3] transition-colors"
                                        style={{
                                          borderLeftColor:
                                            DOT_ESTADO[cita.estado] ||
                                            "#3f484e",
                                        }}
                                      >
                                        <span className="font-bold text-[#151c27]">
                                          {formatearHora(cita.fecha_hora)}
                                        </span>{" "}
                                        <span className="text-[#3f484e]">
                                          {cita.paciente_id?.nombre ||
                                            "Sin paciente"}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Leyenda de estados ── */}
                  <div className="flex flex-wrap gap-3 pt-1">
                    {ESTADOS.map((estado) => (
                      <div
                        key={estado}
                        className="flex items-center gap-1.5 text-[11px] text-[#3f484e]"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{
                            backgroundColor: DOT_ESTADO[estado] || "#3f484e",
                          }}
                        />
                        {estado}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal editar ── */}
      {mostrarModal && citaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#151c27]">
                  Editar Cita
                </h3>
                <p className="text-xs text-[#3f484e] mt-0.5">
                  {citaEditando.paciente_id?.nombre} ·{" "}
                  {citaEditando.usuario_id?.nombre || "N/A"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={handleGuardarEdicion}
              autoComplete="off"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y hora *</Label>
                  <input
                    type="datetime-local"
                    name="fecha_hora"
                    value={formEditar.fecha_hora}
                    onChange={(e) =>
                      setFormEditar((p) => ({
                        ...p,
                        fecha_hora: e.target.value,
                      }))
                    }
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <select
                    name="tipo"
                    value={formEditar.tipo}
                    onChange={(e) =>
                      setFormEditar((p) => ({ ...p, tipo: e.target.value }))
                    }
                    required
                    className={inputCls}
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Estado *</Label>
                <select
                  name="estado"
                  value={formEditar.estado}
                  onChange={(e) =>
                    setFormEditar((p) => ({ ...p, estado: e.target.value }))
                  }
                  required
                  className={inputCls}
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Motivo *</Label>
                <textarea
                  name="motivo"
                  value={formEditar.motivo}
                  onChange={(e) =>
                    setFormEditar((p) => ({ ...p, motivo: e.target.value }))
                  }
                  required
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <Label>Observaciones</Label>
                <textarea
                  name="observaciones"
                  value={formEditar.observaciones}
                  onChange={(e) =>
                    setFormEditar((p) => ({
                      ...p,
                      observaciones: e.target.value,
                    }))
                  }
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {mensajeError && (
                <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-lg px-4 py-3 text-sm text-[#ba1a1a] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>
                  {mensajeError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Citas;
