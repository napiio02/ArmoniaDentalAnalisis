import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  getCitas,
  createCita,
  updateCita,
  cancelarCita,
  getPacientes,
  getUsuarios,
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

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const inputCls =
  "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]";

const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [mostrarPasadas, setMostrarPasadas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [citaEditando, setCitaEditando] = useState(null);

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

  const formatearFecha = (f) =>
    new Date(f).toLocaleString("es-CR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const toInputDateTime = (f) => {
    if (!f) return "";
    const d = new Date(f);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const getFechaMinima = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const handleCrear = async (e) => {
    e.preventDefault();
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
      if (!mostrarPasadas && new Date(c.fecha_hora) < ahora) return false;
      if (
        filtroFecha &&
        new Date(c.fecha_hora).toISOString().split("T")[0] !== filtroFecha
      )
        return false;
      if (filtroEstado && c.estado !== filtroEstado) return false;
      if (filtroTipo && c.tipo !== filtroTipo) return false;
      return true;
    });
  }, [citasOrdenadas, mostrarPasadas, filtroFecha, filtroEstado, filtroTipo]);

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
          <div className="mb-8">
            <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
              Agenda de Citas
            </h2>
            <p className="text-sm text-[#3f484e] mt-1">
              Programa y controla limpiezas, cirugías, revisiones y
              blanqueamientos
            </p>
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
                      {usuarios.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.nombre}
                        </option>
                      ))}
                    </select>
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Fecha y hora *</Label>
                    <input
                      type="datetime-local"
                      name="fecha_hora"
                      value={formNueva.fecha_hora}
                      onChange={(e) =>
                        setFormNueva((p) => ({
                          ...p,
                          fecha_hora: e.target.value,
                        }))
                      }
                      min={getFechaMinima()}
                      required
                      className={inputCls}
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

            {/* ── Lista de citas ── */}
            <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="font-semibold text-[#151c27]">Próximas Citas</h3>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="px-3 py-1.5 border border-[#bec8ce] rounded-lg text-xs focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
                  />
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
                  Mostrar citas pasadas
                </span>
              </label>

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
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal editar ── */}
      {mostrarModal && citaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#151c27]">Editar Cita</h3>
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
