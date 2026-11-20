import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listarProcedimientos,
  crearProcedimiento,
  actualizarProcedimiento,
  anularProcedimiento,
  registrarAbono,
  anularAbono,
  METODOS_PAGO,
} from "../services/procedimientoService";

/*
 * Procedimientos y pagos del paciente: qué se le va a realizar, cuánto cuesta,
 * los abonos que va haciendo y el saldo pendiente. Visible solo para Admin y Dentista.
 * Los montos y saldos los calcula el servidor; aquí solo se muestran.
 */

const SUGERENCIAS = [
  "Limpieza", "Resina", "Endodoncia", "Corona", "Poste intrarradicular", "Puente fijo",
  "Implante", "Extracción", "Blanqueamiento", "Ortodoncia", "Incrustación", "Sellantes",
];

const colones = (monto) =>
  new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", minimumFractionDigits: 2 }).format(monto || 0);

const hoyCR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });

const formatearFecha = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });

const centimos = (valor) => Math.round(Number(valor || 0) * 100);

const ESTADO = {
  Pendiente: "bg-[#ffddb820] text-[#855300] border-[#855300]/20",
  "Con abonos": "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20",
  Pagado: "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/40",
  Anulado: "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]",
};

const inputCls =
  "w-full px-3 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] disabled:bg-[#f0f3ff]";

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const ErrorCaja = ({ children }) =>
  children ? (
    <div role="alert" className="rounded-lg border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a] flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">error</span>
      {children}
    </div>
  ) : null;

/* ───────── Ventana base ───────── */

function Ventana({ titulo, subtitulo, onCerrar, children, ancho = "max-w-lg" }) {
  useEffect(() => {
    const alPresionar = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div role="dialog" aria-modal="true" aria-label={titulo}
        className={`bg-white rounded-2xl shadow-2xl w-full ${ancho} p-5 sm:p-6 max-h-[90dvh] overflow-y-auto`}>
        <div className="flex justify-between items-start mb-5 gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#151c27]">{titulo}</h3>
            {subtitulo && <p className="text-xs text-[#3f484e] mt-0.5">{subtitulo}</p>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Botones = ({ onCancelar, guardando, textoGuardar, deshabilitado, peligro }) => (
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
    <button type="button" onClick={onCancelar}
      className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors">
      Cancelar
    </button>
    <button type="submit" disabled={guardando || deshabilitado}
      className={`px-6 py-2.5 text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 ${peligro ? "bg-[#ba1a1a]" : "bg-[#006686]"}`}>
      {guardando ? <span className="loading loading-spinner loading-xs" /> : textoGuardar}
    </button>
  </div>
);

/* ───────── Nuevo / editar procedimiento ───────── */

function ModalProcedimiento({ inicial, onCerrar, onGuardar }) {
  const editando = Boolean(inicial);
  const [form, setForm] = useState({
    fecha: inicial?.fecha || hoyCR(),
    procedimiento: inicial?.procedimiento || "",
    pieza: inicial?.pieza || "",
    monto: inicial?.monto ?? "",
    notas: inicial?.notas || "",
    abono_inicial: "",
    metodo_pago: "Efectivo",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiar = (campo) => (e) => {
    setError("");
    setForm((p) => ({ ...p, [campo]: e.target.value }));
  };

  const abonadoPrevio = inicial?.abonado || 0;
  const pagadoAhora = editando ? abonadoPrevio : Number(form.abono_inicial || 0);
  const saldo = (centimos(form.monto) - centimos(pagadoAhora)) / 100;

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.procedimiento.trim()) return setError("Indique el procedimiento.");
    if (!(Number(form.monto) > 0)) return setError("El monto debe ser mayor a cero.");
    if (editando && centimos(form.monto) < centimos(abonadoPrevio)) {
      return setError(`El monto no puede ser menor a lo ya abonado (${colones(abonadoPrevio)}).`);
    }
    if (!editando && centimos(form.abono_inicial) > centimos(form.monto)) {
      return setError("El abono inicial no puede ser mayor que el monto.");
    }
    setGuardando(true);
    try {
      const datos = { fecha: form.fecha, procedimiento: form.procedimiento, pieza: form.pieza, monto: Number(form.monto), notas: form.notas };
      if (!editando && Number(form.abono_inicial) > 0) {
        datos.abono_inicial = Number(form.abono_inicial);
        datos.metodo_pago = form.metodo_pago;
      }
      await onGuardar(datos);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <Ventana titulo={editando ? "Editar procedimiento" : "Nuevo procedimiento"}
      subtitulo={editando ? "Los abonos ya registrados se conservan." : "Registre el procedimiento y su costo."} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,8rem] gap-3">
          <div>
            <Label htmlFor="pr-procedimiento">Procedimiento *</Label>
            <input id="pr-procedimiento" list="pr-sugerencias" value={form.procedimiento} onChange={cambiar("procedimiento")}
              maxLength={200} placeholder="Ej: Endodoncia" className={inputCls} autoFocus />
            <datalist id="pr-sugerencias">{SUGERENCIAS.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div>
            <Label htmlFor="pr-pieza">Pieza(s)</Label>
            <input id="pr-pieza" value={form.pieza} onChange={cambiar("pieza")} maxLength={60} placeholder="Ej: 16" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pr-fecha">Fecha *</Label>
            <input id="pr-fecha" type="date" value={form.fecha} max={hoyCR()} onChange={cambiar("fecha")} className={inputCls} />
          </div>
          <div>
            <Label htmlFor="pr-monto">Monto (₡) *</Label>
            <input id="pr-monto" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.monto}
              onChange={cambiar("monto")} placeholder="Ej: 85000" className={inputCls} />
          </div>
        </div>

        {!editando && (
          <div className="rounded-xl border border-[#bec8ce] bg-[#f9f9ff] p-3 space-y-3">
            <p className="text-xs font-semibold text-[#3f484e]">Abono inicial (opcional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pr-abono">Monto del abono (₡)</Label>
                <input id="pr-abono" type="number" inputMode="decimal" min="0" step="0.01" value={form.abono_inicial}
                  onChange={cambiar("abono_inicial")} placeholder="0" className={inputCls} />
              </div>
              <div>
                <Label htmlFor="pr-metodo">Método de pago</Label>
                <select id="pr-metodo" value={form.metodo_pago} onChange={cambiar("metodo_pago")}
                  disabled={!(Number(form.abono_inicial) > 0)} className={inputCls}>
                  {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="pr-notas">Notas</Label>
          <textarea id="pr-notas" rows={2} maxLength={500} value={form.notas} onChange={cambiar("notas")}
            placeholder="Ej: Se realiza en dos citas" className={`${inputCls} resize-none`} />
        </div>

        {Number(form.monto) > 0 && (
          <div className="flex justify-between items-center rounded-lg bg-[#f0f3ff] px-4 py-2.5 text-sm">
            <span className="text-[#3f484e]">{editando ? `Abonado ${colones(abonadoPrevio)} · Saldo` : "Saldo pendiente"}</span>
            <span className={`font-bold ${saldo > 0 ? "text-[#855300]" : "text-[#006b5f]"}`}>{colones(Math.max(saldo, 0))}</span>
          </div>
        )}

        <ErrorCaja>{error}</ErrorCaja>
        <Botones onCancelar={onCerrar} guardando={guardando}
          textoGuardar={<><span className="material-symbols-outlined text-[16px]">check</span>{editando ? "Guardar cambios" : "Registrar procedimiento"}</>} />
      </form>
    </Ventana>
  );
}

/* ───────── Registrar abono ───────── */

function ModalAbono({ procedimiento, onCerrar, onGuardar }) {
  const [form, setForm] = useState({ fecha: hoyCR(), monto: "", metodo: "Efectivo", nota: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiar = (campo) => (e) => {
    setError("");
    setForm((p) => ({ ...p, [campo]: e.target.value }));
  };
  const saldoDespues = (centimos(procedimiento.saldo) - centimos(form.monto)) / 100;

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (!(Number(form.monto) > 0)) return setError("El abono debe ser mayor a cero.");
    if (saldoDespues < 0) return setError(`El abono no puede ser mayor al saldo pendiente (${colones(procedimiento.saldo)}).`);
    setGuardando(true);
    try {
      await onGuardar({ ...form, monto: Number(form.monto) });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <Ventana titulo="Registrar abono" subtitulo={`${procedimiento.procedimiento}${procedimiento.pieza ? ` · Pieza ${procedimiento.pieza}` : ""}`} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Monto", procedimiento.monto], ["Abonado", procedimiento.abonado], ["Saldo", procedimiento.saldo]].map(([t, v]) => (
            <div key={t} className="rounded-lg bg-[#f0f3ff] px-2 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3f484e]">{t}</p>
              <p className="text-sm font-bold text-[#151c27]">{colones(v)}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ab-monto">Monto del abono (₡) *</Label>
            <input id="ab-monto" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.monto}
              onChange={cambiar("monto")} className={inputCls} autoFocus />
            <button type="button" onClick={() => setForm((p) => ({ ...p, monto: String(procedimiento.saldo) }))}
              className="mt-1 text-xs font-semibold text-[#006686] hover:underline">
              Pagar el saldo completo
            </button>
          </div>
          <div>
            <Label htmlFor="ab-fecha">Fecha *</Label>
            <input id="ab-fecha" type="date" value={form.fecha} max={hoyCR()} onChange={cambiar("fecha")} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ab-metodo">Método de pago</Label>
            <select id="ab-metodo" value={form.metodo} onChange={cambiar("metodo")} className={inputCls}>
              {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="ab-nota">Nota</Label>
            <input id="ab-nota" value={form.nota} onChange={cambiar("nota")} maxLength={300} placeholder="Ej: Comprobante 1234" className={inputCls} />
          </div>
        </div>
        {Number(form.monto) > 0 && (
          <div className="flex justify-between items-center rounded-lg bg-[#f0f3ff] px-4 py-2.5 text-sm">
            <span className="text-[#3f484e]">Saldo después del abono</span>
            <span className={`font-bold ${saldoDespues < 0 ? "text-[#ba1a1a]" : saldoDespues === 0 ? "text-[#006b5f]" : "text-[#855300]"}`}>
              {saldoDespues < 0 ? "Supera el saldo" : saldoDespues === 0 ? "Pagado por completo" : colones(saldoDespues)}
            </span>
          </div>
        )}
        <ErrorCaja>{error}</ErrorCaja>
        <Botones onCancelar={onCerrar} guardando={guardando}
          textoGuardar={<><span className="material-symbols-outlined text-[16px]">payments</span>Registrar abono</>} />
      </form>
    </Ventana>
  );
}

/* ───────── Anular (procedimiento o abono) ───────── */

function ModalAnular({ titulo, detalle, onCerrar, onConfirmar }) {
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) return setError("Indique el motivo de la anulación.");
    setGuardando(true);
    try {
      await onConfirmar(motivo.trim());
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <Ventana titulo={titulo} subtitulo={detalle} onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <p className="text-sm text-[#3f484e]">
          El registro no se borra: queda marcado como anulado, con el motivo y quién lo anuló, y deja de contar en los totales.
        </p>
        <div>
          <Label htmlFor="an-motivo">Motivo *</Label>
          <textarea id="an-motivo" rows={3} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Se registró por error" className={`${inputCls} resize-none`} autoFocus />
        </div>
        <ErrorCaja>{error}</ErrorCaja>
        <Botones onCancelar={onCerrar} guardando={guardando} deshabilitado={!motivo.trim()} peligro
          textoGuardar={<><span className="material-symbols-outlined text-[16px]">block</span>Anular</>} />
      </form>
    </Ventana>
  );
}

/* ───────── Tarjeta de un procedimiento ───────── */

function TarjetaProcedimiento({ p, abierto, onAlternar, onAbonar, onEditar, onAnular, onAnularAbono }) {
  const anulado = p.estado === "Anulado";
  const porcentaje = p.monto > 0 ? Math.min(100, Math.round((p.abonado / p.monto) * 100)) : 0;
  const abonosVigentes = p.abonos.filter((a) => !a.anulado).length;

  return (
    <li className={`border border-[#bec8ce] rounded-xl p-4 ${anulado ? "bg-[#f9f9ff] opacity-70" : "bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-[#3f484e]">
            {formatearFecha(p.fecha)}{p.pieza ? ` · Pieza ${p.pieza}` : ""}
          </p>
          <p className={`text-sm font-semibold text-[#151c27] ${anulado ? "line-through" : ""}`}>{p.procedimiento}</p>
          {p.notas && <p className="text-xs text-[#3f484e] mt-0.5">{p.notas}</p>}
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ESTADO[p.estado]}`}>{p.estado}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[["Monto", p.monto, "text-[#151c27]"], ["Abonado", p.abonado, "text-[#006686]"],
          ["Saldo", p.saldo, p.saldo > 0 ? "text-[#855300]" : "text-[#006b5f]"]].map(([t, v, color]) => (
          <div key={t}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3f484e]">{t}</p>
            <p className={`text-sm font-bold ${anulado ? "text-[#3f484e]" : color}`}>{colones(v)}</p>
          </div>
        ))}
      </div>
      {!anulado && (
        <div className="mt-2 h-1.5 rounded-full bg-[#f0f3ff] overflow-hidden" aria-label={`Pagado ${porcentaje}%`}>
          <div className="h-full bg-[#006686] rounded-full" style={{ width: `${porcentaje}%` }} />
        </div>
      )}
      {anulado && (
        <p className="mt-2 text-xs text-[#3f484e]">
          Anulado{p.anulado_por?.nombre ? ` por ${p.anulado_por.nombre}` : ""}: {p.motivo_anulacion}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {!anulado && p.saldo > 0 && (
          <button type="button" onClick={onAbonar}
            className="px-3 py-1.5 rounded-full bg-[#006686] text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">payments</span>
            Registrar abono
          </button>
        )}
        {p.abonos.length > 0 && (
          <button type="button" onClick={onAlternar} aria-expanded={abierto}
            className="px-3 py-1.5 rounded-full border border-[#bec8ce] text-xs font-semibold text-[#3f484e] hover:border-[#006686] hover:text-[#006686] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">{abierto ? "expand_less" : "expand_more"}</span>
            Abonos ({abonosVigentes})
          </button>
        )}
        {!anulado && (
          <>
            <button type="button" onClick={onEditar}
              className="px-3 py-1.5 rounded-full border border-[#bec8ce] text-xs font-semibold text-[#3f484e] hover:border-[#006686] hover:text-[#006686]">
              Editar
            </button>
            <button type="button" onClick={onAnular}
              className="px-3 py-1.5 rounded-full border border-[#bec8ce] text-xs font-semibold text-[#ba1a1a] hover:border-[#ba1a1a] hover:bg-[#ffdad6]/30">
              Anular
            </button>
          </>
        )}
      </div>

      {abierto && p.abonos.length > 0 && (
        <ul className="mt-3 divide-y divide-[#bec8ce]/50 border-t border-[#bec8ce]/50">
          {p.abonos.map((a) => (
            <li key={a._id} className={`py-2 flex flex-wrap items-start justify-between gap-2 text-xs ${a.anulado ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <p className={`font-semibold text-[#151c27] ${a.anulado ? "line-through" : ""}`}>
                  {colones(a.monto)} <span className="font-normal text-[#3f484e]">· {a.metodo} · {formatearFecha(a.fecha)}</span>
                </p>
                <p className="text-[#3f484e]">
                  {a.nota ? `${a.nota} · ` : ""}Registró: {a.registrado_por?.nombre || "—"}
                </p>
                {a.anulado && (
                  <p className="text-[#ba1a1a]">Anulado{a.anulado_por?.nombre ? ` por ${a.anulado_por.nombre}` : ""}: {a.motivo_anulacion}</p>
                )}
              </div>
              {!a.anulado && !anulado && (
                <button type="button" onClick={() => onAnularAbono(a)} className="text-[#ba1a1a] font-semibold hover:underline">
                  Anular abono
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/* ───────── Sección principal ───────── */

export default function ProcedimientosPaciente({ pacienteId }) {
  const [datos, setDatos] = useState({ procedimientos: [], resumen: null });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [abiertos, setAbiertos] = useState({});
  const [verAnulados, setVerAnulados] = useState(false);
  const [modal, setModal] = useState(null); // { tipo, procedimiento?, abono? }

  const cargar = useCallback(async () => {
    if (!pacienteId) return;
    setCargando(true);
    setError("");
    try {
      const respuesta = await listarProcedimientos(pacienteId);
      setDatos(respuesta.data || { procedimientos: [], resumen: null });
    } catch (err) {
      setError(err.message || "No se pudieron cargar los procedimientos.");
    } finally {
      setCargando(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    setAbiertos({});
    setVerAnulados(false);
    setModal(null);
    cargar();
  }, [cargar]);

  const mostrarAviso = (texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(""), 3500);
  };

  // Tras guardar en el servidor se recarga todo para que los totales siempre coincidan
  const completar = async (accion, texto) => {
    await accion();
    setModal(null);
    mostrarAviso(texto);
    await cargar();
  };

  const anulados = datos.procedimientos.filter((p) => p.estado === "Anulado");
  const visibles = useMemo(
    () => datos.procedimientos.filter((p) => verAnulados || p.estado !== "Anulado"),
    [datos.procedimientos, verAnulados],
  );
  const resumen = datos.resumen;

  return (
    <div className="bg-white border border-[#bec8ce] rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h3 className="font-semibold text-[#151c27] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006686] text-[20px]">request_quote</span>
          Procedimientos y pagos
        </h3>
        <button type="button" onClick={() => setModal({ tipo: "nuevo" })} disabled={cargando || Boolean(error)}
          className="px-4 py-2 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Nuevo procedimiento
        </button>
      </div>

      {aviso && (
        <div role="status" className="mb-4 rounded-lg border border-[#6df5e1]/40 bg-[#6df5e120] px-4 py-2.5 text-sm text-[#006b5f] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {aviso}
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md text-[#006686]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-6 text-sm text-[#ba1a1a]">
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">error</span>{error}</span>
          <button type="button" onClick={cargar} className="text-xs font-semibold text-[#006686] hover:underline">Reintentar</button>
        </div>
      ) : (
        <>
          {resumen && resumen.cantidad > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              {[
                ["Total", resumen.total, "text-[#151c27]", "bg-[#f0f3ff]"],
                ["Abonado", resumen.abonado, "text-[#006686]", "bg-[#7dd3fc20]"],
                ["Saldo pendiente", resumen.saldo, resumen.saldo > 0 ? "text-[#855300]" : "text-[#006b5f]",
                  resumen.saldo > 0 ? "bg-[#ffddb830]" : "bg-[#6df5e120]"],
              ].map(([t, v, color, fondo]) => (
                <div key={t} className={`rounded-xl ${fondo} px-3 py-3`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3f484e]">{t}</p>
                  <p className={`text-base sm:text-lg font-bold ${color}`}>{colones(v)}</p>
                </div>
              ))}
            </div>
          )}

          {datos.procedimientos.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">request_quote</span>
              <p className="text-sm text-[#3f484e]">Este paciente no tiene procedimientos registrados.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {visibles.map((p) => (
                  <TarjetaProcedimiento
                    key={p._id}
                    p={p}
                    abierto={Boolean(abiertos[p._id])}
                    onAlternar={() => setAbiertos((prev) => ({ ...prev, [p._id]: !prev[p._id] }))}
                    onAbonar={() => setModal({ tipo: "abono", procedimiento: p })}
                    onEditar={() => setModal({ tipo: "editar", procedimiento: p })}
                    onAnular={() => setModal({ tipo: "anular", procedimiento: p })}
                    onAnularAbono={(a) => setModal({ tipo: "anularAbono", procedimiento: p, abono: a })}
                  />
                ))}
              </ul>
              {visibles.length === 0 && (
                <p className="text-sm text-[#3f484e] text-center py-4">Todos los procedimientos de este paciente están anulados.</p>
              )}
              {anulados.length > 0 && (
                <button type="button" onClick={() => setVerAnulados((v) => !v)}
                  className="mt-3 text-xs font-semibold text-[#3f484e] hover:text-[#006686] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">{verAnulados ? "visibility_off" : "visibility"}</span>
                  {verAnulados ? "Ocultar anulados" : `Mostrar anulados (${anulados.length})`}
                </button>
              )}
            </>
          )}
        </>
      )}

      {modal?.tipo === "nuevo" && (
        <ModalProcedimiento onCerrar={() => setModal(null)}
          onGuardar={(d) => completar(() => crearProcedimiento(pacienteId, d), "Procedimiento registrado.")} />
      )}
      {modal?.tipo === "editar" && (
        <ModalProcedimiento inicial={modal.procedimiento} onCerrar={() => setModal(null)}
          onGuardar={(d) => completar(() => actualizarProcedimiento(modal.procedimiento._id, d), "Procedimiento actualizado.")} />
      )}
      {modal?.tipo === "abono" && (
        <ModalAbono procedimiento={modal.procedimiento} onCerrar={() => setModal(null)}
          onGuardar={(d) => completar(() => registrarAbono(modal.procedimiento._id, d), "Abono registrado.")} />
      )}
      {modal?.tipo === "anular" && (
        <ModalAnular titulo="Anular procedimiento"
          detalle={`${modal.procedimiento.procedimiento} · ${colones(modal.procedimiento.monto)}`}
          onCerrar={() => setModal(null)}
          onConfirmar={(motivo) => completar(() => anularProcedimiento(modal.procedimiento._id, motivo), "Procedimiento anulado.")} />
      )}
      {modal?.tipo === "anularAbono" && (
        <ModalAnular titulo="Anular abono"
          detalle={`${colones(modal.abono.monto)} · ${modal.abono.metodo} · ${formatearFecha(modal.abono.fecha)}`}
          onCerrar={() => setModal(null)}
          onConfirmar={(motivo) =>
            completar(() => anularAbono(modal.procedimiento._id, modal.abono._id, motivo), "Abono anulado. El saldo se actualizó.")} />
      )}
    </div>
  );
}
