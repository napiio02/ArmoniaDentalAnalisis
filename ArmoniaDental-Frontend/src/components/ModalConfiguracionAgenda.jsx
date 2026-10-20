import { useMemo, useState } from "react";
import { updateConfiguracionAgenda } from "../services/citaService";

const pad = (n) => String(n).padStart(2, "0");

const formatoHora12 = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? "p. m." : "a. m."}`;
};

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Horas disponibles para abrir y cerrar: cada 30 minutos, de 5:00 a. m. a 10:00 p. m.
const OPCIONES_HORA = Array.from({ length: 35 }, (_, i) => {
  const min = 5 * 60 + i * 30;
  const valor = `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
  return { valor, etiqueta: formatoHora12(valor) };
});

const PRESETS = [
  { inicio: "07:00", fin: "16:00" },
  { inicio: "08:00", fin: "17:00" },
  { inicio: "09:00", fin: "18:00" },
];

// Lunes primero (0 = domingo en el backend)
const DIAS = [
  { dia: 1, corto: "Lun", largo: "Lunes" },
  { dia: 2, corto: "Mar", largo: "Martes" },
  { dia: 3, corto: "Mié", largo: "Miércoles" },
  { dia: 4, corto: "Jue", largo: "Jueves" },
  { dia: 5, corto: "Vie", largo: "Viernes" },
  { dia: 6, corto: "Sáb", largo: "Sábado" },
  { dia: 0, corto: "Dom", largo: "Domingo" },
];

const hoyCR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });

const formatearFecha = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const Titulo = ({ children }) => (
  <h4 className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-2">{children}</h4>
);

const selectCls =
  "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] disabled:bg-[#f0f3ff] disabled:cursor-not-allowed";

/*
 * Horario de atención y días sin atención de la agenda.
 * - puedeEditar=false: solo lectura (para usuarios que no son Admin ni Dentista).
 * - onGuardada(config): se llama con la configuración ya guardada.
 */
const ModalConfiguracionAgenda = ({ config, puedeEditar, onClose, onGuardada }) => {
  const [horaInicio, setHoraInicio] = useState(config.horaInicio);
  const [horaFin, setHoraFin] = useState(config.horaFin);
  const [diasCerrados, setDiasCerrados] = useState(config.diasNoLaborables);
  const [fechas, setFechas] = useState(config.fechasNoLaborables);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevoMotivo, setNuevoMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null); // citas afectadas tras guardar

  const hoy = hoyCR();
  const fechasProximas = useMemo(
    () => fechas.filter((f) => f.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [fechas, hoy],
  );

  const horarioInvalido = aMinutos(horaFin) <= aMinutos(horaInicio);
  const todosCerrados = diasCerrados.length >= 7;
  const hayCambios =
    horaInicio !== config.horaInicio ||
    horaFin !== config.horaFin ||
    JSON.stringify([...diasCerrados].sort()) !== JSON.stringify([...config.diasNoLaborables].sort()) ||
    JSON.stringify(fechas) !== JSON.stringify(config.fechasNoLaborables);

  const alternarDia = (dia) =>
    setDiasCerrados((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));

  const agregarFecha = () => {
    setError("");
    if (!nuevaFecha) return setError("Elige la fecha que no se va a trabajar.");
    if (nuevaFecha < hoy) return setError("La fecha no puede ser anterior a hoy.");
    if (fechas.some((f) => f.fecha === nuevaFecha)) return setError("Esa fecha ya está en la lista.");
    setFechas((prev) => [...prev, { fecha: nuevaFecha, motivo: nuevoMotivo.trim() }]);
    setNuevaFecha("");
    setNuevoMotivo("");
  };

  const quitarFecha = (fecha) => setFechas((prev) => prev.filter((f) => f.fecha !== fecha));

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      const respuesta = await updateConfiguracionAgenda({
        horaInicio,
        horaFin,
        diasNoLaborables: diasCerrados,
        fechasNoLaborables: fechas,
      });
      onGuardada(respuesta.data);
      if (respuesta.citasAfectadas?.total > 0) setResultado(respuesta.citasAfectadas);
      else onClose();
    } catch (err) {
      setError(err.message || "No se pudo guardar el horario.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-config-agenda"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 id="titulo-config-agenda" className="text-lg font-bold text-[#151c27]">
              Horario y días sin atención
            </h3>
            <p className="text-xs text-[#3f484e] mt-0.5">
              {puedeEditar
                ? "Define cuándo se pueden agendar citas. Los cambios aplican a las citas nuevas."
                : "Solo el administrador o el dentista pueden modificar el horario."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {resultado ? (
          <div>
            <div className="rounded-xl border border-[#6df5e1]/40 bg-[#6df5e120] px-4 py-3 text-sm text-[#006b5f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Horario actualizado correctamente.
            </div>
            <div className="rounded-xl border border-[#855300]/30 bg-[#ffddb820] p-4">
              <p className="text-sm font-semibold text-[#855300] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                {resultado.total === 1
                  ? "Hay 1 cita programada en un día u horario sin atención"
                  : `Hay ${resultado.total} citas programadas en días u horarios sin atención`}
              </p>
              <p className="text-xs text-[#3f484e] mt-1">
                No se cancelaron. Reagéndalas o cancélalas desde la agenda.
              </p>
              <ul className="mt-3 space-y-1.5">
                {resultado.ejemplos.map((c) => (
                  <li key={c._id} className="text-xs text-[#151c27] bg-white border border-[#bec8ce] rounded-lg px-3 py-2">
                    <span className="font-semibold">{c.paciente}</span> · {c.tipo} · {c.fecha},{" "}
                    {new Date(c.fecha_hora).toLocaleTimeString("es-CR", {
                      timeZone: "America/Costa_Rica",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </li>
                ))}
              </ul>
              {resultado.total > resultado.ejemplos.length && (
                <p className="text-xs text-[#3f484e] mt-2">
                  y {resultado.total - resultado.ejemplos.length} más…
                </p>
              )}
            </div>
            <div className="flex justify-end pt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Entendido
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Horario de atención ── */}
            <section>
              <Titulo>Horario de atención</Titulo>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cfg-inicio" className="block text-xs text-[#3f484e] mb-1">
                    Apertura
                  </label>
                  <select
                    id="cfg-inicio"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    disabled={!puedeEditar}
                    className={selectCls}
                  >
                    {OPCIONES_HORA.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cfg-fin" className="block text-xs text-[#3f484e] mb-1">
                    Cierre
                  </label>
                  <select
                    id="cfg-fin"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    disabled={!puedeEditar}
                    className={selectCls}
                  >
                    {OPCIONES_HORA.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {puedeEditar && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {PRESETS.map((p) => {
                    const activo = horaInicio === p.inicio && horaFin === p.fin;
                    return (
                      <button
                        key={p.inicio + p.fin}
                        type="button"
                        onClick={() => {
                          setHoraInicio(p.inicio);
                          setHoraFin(p.fin);
                        }}
                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                          activo
                            ? "border-[#006686] bg-[#7dd3fc20] text-[#006686]"
                            : "border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686]"
                        }`}
                      >
                        {formatoHora12(p.inicio)} – {formatoHora12(p.fin)}
                      </button>
                    );
                  })}
                </div>
              )}

              {horarioInvalido && (
                <p className="mt-2 text-xs text-[#ba1a1a]">
                  La hora de cierre debe ser posterior a la de apertura.
                </p>
              )}
            </section>

            {/* ── Días fijos sin atención ── */}
            <section>
              <Titulo>Días de la semana sin atención</Titulo>
              <div className="grid grid-cols-7 gap-2">
                {DIAS.map(({ dia, corto, largo }) => {
                  const cerrado = diasCerrados.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      aria-pressed={cerrado}
                      aria-label={`${largo}: ${cerrado ? "sin atención" : "con atención"}`}
                      disabled={!puedeEditar}
                      onClick={() => alternarDia(dia)}
                      className={`rounded-xl border py-2.5 text-center transition-colors disabled:cursor-not-allowed ${
                        cerrado
                          ? "border-[#ba1a1a]/30 bg-[#ffdad6] text-[#ba1a1a]"
                          : "border-[#bec8ce] bg-white text-[#151c27] hover:border-[#006686]"
                      }`}
                    >
                      <span className="block text-xs font-bold">{corto}</span>
                      <span className="block text-[10px] mt-0.5">{cerrado ? "Cerrado" : "Abierto"}</span>
                    </button>
                  );
                })}
              </div>
              {todosCerrados && (
                <p className="mt-2 text-xs text-[#ba1a1a]">Debe quedar al menos un día con atención.</p>
              )}
            </section>

            {/* ── Fechas específicas ── */}
            <section>
              <Titulo>Días específicos sin atención</Titulo>
              <p className="text-xs text-[#3f484e] mb-3">
                Feriados, vacaciones, capacitaciones… En esas fechas no se podrán agendar citas.
              </p>

              {fechasProximas.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#bec8ce] bg-[#f9f9ff] px-4 py-3 text-xs text-[#3f484e]">
                  No hay fechas próximas marcadas como sin atención.
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {fechasProximas.map((f) => (
                    <li
                      key={f.fecha}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#bec8ce] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#151c27] capitalize">{formatearFecha(f.fecha)}</p>
                        {f.motivo && <p className="text-xs text-[#3f484e] truncate">{f.motivo}</p>}
                      </div>
                      {puedeEditar && (
                        <button
                          type="button"
                          onClick={() => quitarFecha(f.fecha)}
                          aria-label={`Quitar ${formatearFecha(f.fecha)}`}
                          className="p-1 rounded-lg text-[#3f484e] hover:bg-[#ffdad6]/40 hover:text-[#ba1a1a] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {puedeEditar && (
                <div className="mt-3 grid grid-cols-[auto,1fr,auto] gap-2 items-end">
                  <div>
                    <label htmlFor="cfg-fecha" className="block text-xs text-[#3f484e] mb-1">
                      Fecha
                    </label>
                    <input
                      id="cfg-fecha"
                      type="date"
                      value={nuevaFecha}
                      min={hoy}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                      className={selectCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="cfg-motivo" className="block text-xs text-[#3f484e] mb-1">
                      Motivo (opcional)
                    </label>
                    <input
                      id="cfg-motivo"
                      type="text"
                      value={nuevoMotivo}
                      maxLength={120}
                      placeholder="Ej: Feriado, vacaciones"
                      onChange={(e) => setNuevoMotivo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          agregarFecha();
                        }
                      }}
                      className={selectCls}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarFecha}
                    className="px-4 py-2.5 border border-[#006686] text-[#006686] rounded-lg text-xs font-semibold hover:bg-[#7dd3fc20] transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Agregar
                  </button>
                </div>
              )}
            </section>

            {error && (
              <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-lg px-4 py-3 text-sm text-[#ba1a1a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
              >
                {puedeEditar ? "Cancelar" : "Cerrar"}
              </button>
              {puedeEditar && (
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando || horarioInvalido || todosCerrados || !hayCambios}
                  className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      Guardar cambios
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalConfiguracionAgenda;
