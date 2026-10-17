import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import toast, { Toaster } from "react-hot-toast";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Filter,
  History,
  Info,
  ListChecks,
  LogIn,
  LogOut,
  Lock,
  PencilLine,
  Play,
  Square,
  Timer,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { obtenerSesion } from "../services/authService";
import { listarPersonal } from "../services/usuarioService";
import {
  obtenerMarcas,
  obtenerResumenMarcas,
  obtenerJornadaActiva,
  obtenerMarcasPendientes,
  iniciarJornada as iniciarJornadaApi,
  finalizarJornada as finalizarJornadaApi,
  crearMarcaManual,
  justificarMarca as justificarMarcaApi,
  aprobarMarca as aprobarMarcaApi,
  rechazarMarca as rechazarMarcaApi,
} from "../services/marcaService";

const ROL_CON_VISIBILIDAD_TOTAL = "Dentista";
const ZONA_HORARIA = "America/Costa_Rica";

const RESUMEN_VACIO = {
  enJornada: 0,
  horasHoy: 0,
  marcasHoy: 0,
  marcasManuales: 0,
  porEmpleado: [],
};

const TIPOS_JUSTIFICACION = [
  "Olvidó marcar entrada",
  "Olvidó marcar salida",
  "Corrección de marca",
  "Problema técnico",
  "Permiso administrativo",
  "Atención de emergencia",
  "Otro",
];

const ESTADOS_PENDIENTES = ["Pendiente aprobación", "Justificada pendiente"];

/* ── Utilidades ──────────────────────────────────────────── */
const hoyISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });

const formatearDuracion = (ms) => {
  if (!ms || ms < 0) return "00h 00m";
  const totalMinutos = Math.floor(ms / 60000);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, "0")}h ${String(minutos).padStart(2, "0")}m`;
};

const calcularHoras = (entrada, salida) => {
  if (!entrada || !salida) return 0;
  const [eh, em] = entrada.split(":").map(Number);
  const [sh, sm] = salida.split(":").map(Number);
  const mins = sh * 60 + sm - (eh * 60 + em);
  if (mins <= 0) return 0;
  return Math.round((mins / 60) * 100) / 100;
};

const extraerDatos = (resultado, fallback) => {
  if (resultado === null || resultado === undefined) return fallback;
  if (Array.isArray(resultado)) return resultado;
  if (resultado.data !== undefined) return resultado.data;
  return resultado;
};

const normalizarUsuario = (raw) => {
  const u = raw?.usuario || raw?.user || raw;
  if (!u) return null;

  return {
    _id: u._id || u.id,
    nombre: u.nombre,
    rol: u.rol_id?.nombre || u.rol?.nombre || u.rol || null,
  };
};

// El usuario_id que viene poblado en las marcas trae rol_id.nombre, no rol
const nombreRolDe = (usuarioObj) =>
  usuarioObj?.rol_id?.nombre || usuarioObj?.rol?.nombre || usuarioObj?.rol || "—";

const getInitials = (nombre = "") =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const sumarDiasISO = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  fecha.setUTCDate(fecha.getUTCDate() + n);
  return fecha.toISOString().slice(0, 10);
};

// Lunes de la semana a la que pertenece la fecha
const inicioSemanaISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const diaSemana = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 0 = lunes
  return sumarDiasISO(iso, -diaSemana);
};

const textoFechaCorta = (iso, conMes = true) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-CR", {
    timeZone: "UTC",
    day: "numeric",
    ...(conMes && { month: "long" }),
  });

const rangoSemanaTexto = (inicio, fin) => {
  const mismoMes = inicio.slice(0, 7) === fin.slice(0, 7);
  return `Semana del ${textoFechaCorta(inicio, !mismoMes)} al ${textoFechaCorta(fin)}`;
};

/* ── Toast (mismo estilo que el Odontograma) ─────────────── */
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
        className={`relative overflow-hidden min-w-[360px] max-w-[430px] rounded-2xl border ${c.border} bg-white shadow-xl transition-all duration-500 ${
          t.visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-3 opacity-0 scale-95"
        }`}
      >
        <div className="flex gap-4 p-5">
          <div
            className={`h-11 w-11 shrink-0 rounded-xl ${c.iconBg} ${c.iconColor} flex items-center justify-center`}
          >
            {c.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-[#151c27]">{title}</h3>
            <p className="mt-1 text-[13px] text-[#3f484e]">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            aria-label="Cerrar notificación"
            className="text-[#bec8ce] hover:text-[#3f484e] transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="h-[3px] w-full bg-[#f0f3ff]">
          <div className={`h-full ${c.progress} animate-[toastbar_4.2s_linear_forwards]`} />
        </div>
      </div>
    ),
    { duration: 4200 },
  );
};

/* ── Piezas de UI reutilizables ──────────────────────────── */
const TONOS = {
  primary: "bg-[#7dd3fc20] text-[#006686]",
  success: "bg-[#6df5e120] text-[#006b5f]",
  warning: "bg-[#ffddb820] text-[#855300]",
  danger: "bg-[#ffdad6]/60 text-[#ba1a1a]",
  neutral: "bg-[#dce2f3] text-[#3f484e]",
};

const IconChip = ({ icon: Icon, tone = "primary", size = 18 }) => (
  <div className={`rounded-xl p-2 flex-shrink-0 ${TONOS[tone]}`}>
    <Icon size={size} />
  </div>
);

const SectionHeader = ({ icon, tone, title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div className="flex items-center gap-3 min-w-0">
      <IconChip icon={icon} tone={tone} />
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[#151c27]">{title}</h3>
        {subtitle && <p className="text-xs text-[#3f484e]">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

const Avatar = ({ nombre, size = "md" }) => (
  <div
    className={`${
      size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
    } rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center font-bold text-[#006686] flex-shrink-0`}
  >
    {getInitials(nombre) || "?"}
  </div>
);

const Label = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="block text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5"
  >
    {children}
  </label>
);

const inputCls =
  "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] transition-colors";

const EstadoJornada = ({ activa }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
      activa
        ? "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/40"
        : "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        activa ? "bg-[#006b5f] animate-pulse" : "bg-[#3f484e]"
      }`}
    />
    {activa ? "Activa" : "Sin jornada"}
  </span>
);

const BadgeEstado = ({ estado }) => {
  const valor = estado || "Completa";
  const estilo = ESTADOS_PENDIENTES.includes(valor)
    ? { cls: "bg-[#ffddb820] text-[#855300] border-[#855300]/20", dot: "bg-[#855300]" }
    : valor === "Rechazada"
      ? { cls: "bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/20", dot: "bg-[#ba1a1a]" }
      : { cls: "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/40", dot: "bg-[#006b5f]" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${estilo.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
      {valor}
    </span>
  );
};

const BadgeTipo = ({ tipo }) => {
  const valor = tipo || "Manual";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        valor === "Manual"
          ? "bg-[#ffddb820] text-[#855300] border-[#855300]/20"
          : "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20"
      }`}
    >
      {valor}
    </span>
  );
};

const StatTile = ({ icon, tone, label, value }) => (
  <div className="rounded-xl border border-[#bec8ce] bg-[#f9f9ff] p-4 flex items-center gap-3">
    <IconChip icon={icon} tone={tone} />
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-[#151c27] leading-tight">{value}</p>
    </div>
  </div>
);

const ModalShell = ({ id, icon, titulo, subtitulo, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#bec8ce] overflow-hidden max-h-[92vh] flex flex-col"
    >
      <div className="px-5 py-4 border-b border-[#bec8ce] bg-[#f0f3ff] flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <IconChip icon={icon} />
          <div>
            <h3 id={id} className="font-semibold text-[#151c27]">
              {titulo}
            </h3>
            {subtitulo && <p className="text-xs text-[#3f484e] mt-0.5">{subtitulo}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="p-1.5 rounded-lg hover:bg-[#dce2f3] transition text-[#3f484e]"
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ModalFooter = ({ onCancel, guardando, icon: Icon = Check, textoGuardar }) => (
  <div className="px-5 py-4 border-t border-[#bec8ce] bg-[#f0f3ff] flex justify-end gap-2">
    <button
      type="button"
      onClick={onCancel}
      className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-white border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition"
    >
      Cancelar
    </button>
    <button
      type="submit"
      disabled={guardando}
      className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-60"
    >
      {guardando ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <>
          <Icon size={15} />
          {textoGuardar}
        </>
      )}
    </button>
  </div>
);

/* ── Relojes: se actualizan solos, sin re-renderizar la página ── */
const useAhora = (intervaloMs = 1000) => {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return ahora;
};

const RelojCostaRica = () => {
  const ahora = useAhora(1000);
  const hora = ahora.toLocaleTimeString("es-CR", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const fecha = ahora.toLocaleDateString("es-CR", {
    timeZone: ZONA_HORARIA,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#bec8ce] bg-white px-4 py-2.5 shadow-sm">
      <IconChip icon={Clock} />
      <div>
        <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
          Hora en Costa Rica
        </p>
        <p className="font-mono text-sm font-bold text-[#151c27]">{hora}</p>
      </div>
      <div className="hidden md:block w-px h-8 bg-[#bec8ce]" />
      <p className="hidden md:block text-xs text-[#3f484e] first-letter:uppercase">{fecha}</p>
    </div>
  );
};

const TiempoActivo = ({ inicio }) => {
  const ahora = useAhora(1000);
  const ms = inicio ? ahora.getTime() - new Date(inicio).getTime() : 0;
  return <span>{formatearDuracion(ms)}</span>;
};

/* ── Página ──────────────────────────────────────────────── */
const ControlMarcas = () => {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  const usuarioActivoId = usuarioLogueado?._id || "";
  const puedeVerTodo = ["Admin", ROL_CON_VISIBILIDAD_TOTAL].includes(usuarioLogueado?.rol);

  const [usuarios, setUsuarios] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [resumen, setResumen] = useState(RESUMEN_VACIO);
  const [jornadaActiva, setJornadaActiva] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  // Marcas propias de hoy (independientes de los filtros de la tabla) para el panel Mi jornada
  const [marcasHoyPropias, setMarcasHoyPropias] = useState([]);

  // Hoja de horas semanal
  const [semanaOffset, setSemanaOffset] = useState(0); // 0 = esta semana, -1 = la anterior...
  const [marcasSemana, setMarcasSemana] = useState([]);
  const [cargandoSemana, setCargandoSemana] = useState(true);
  const [errorSemana, setErrorSemana] = useState(false);

  const [cargandoMarcas, setCargandoMarcas] = useState(true);
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalJustificacion, setMostrarModalJustificacion] = useState(false);
  const [marcaJustificando, setMarcaJustificando] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null); // { tipo: "sesion" | "marcas", mensaje }

  const [formNueva, setFormNueva] = useState({
    usuario_id: "",
    fecha: hoyISO(),
    hora_entrada: "",
    hora_salida: "",
    observaciones: "",
  });

  const [formJustificacion, setFormJustificacion] = useState({
    tipo: "Olvidó marcar salida",
    hora_sugerida: "",
    motivo: "",
  });

  // Última jornada propia de hoy (ignora las rechazadas). Se muestra en Mi jornada cuando no hay una activa.
  const jornadasHoy = useMemo(
    () =>
      marcasHoyPropias
        .filter((m) => m.hora_entrada && m.estado !== "Rechazada")
        .sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada)),
    [marcasHoyPropias],
  );
  const ultimaMarcaHoy = jornadasHoy.length ? jornadasHoy[jornadasHoy.length - 1] : null;

  /* ── Hoja de horas semanal (se arma en el front con las marcas de cada día) ── */
  const hoy = hoyISO();
  const inicioSemana = sumarDiasISO(inicioSemanaISO(hoy), semanaOffset * 7);
  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => sumarDiasISO(inicioSemana, i)),
    [inicioSemana],
  );

  const semanaReqRef = useRef(0);
  const cargarSemana = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!usuarioLogueado) return;
      const reqId = ++semanaReqRef.current;
      if (!silencioso) setCargandoSemana(true);

      try {
        const respuestas = await Promise.all(
          diasSemana.map((fecha) =>
            obtenerMarcas({ fecha, usuario_id: puedeVerTodo ? undefined : usuarioActivoId }),
          ),
        );
        if (reqId !== semanaReqRef.current) return; // llegó la respuesta de otra semana
        setMarcasSemana(respuestas.flatMap((r) => extraerDatos(r, [])));
        setErrorSemana(false);
      } catch (err) {
        if (reqId === semanaReqRef.current) setErrorSemana(true);
      } finally {
        if (reqId === semanaReqRef.current) setCargandoSemana(false);
      }
    },
    [usuarioLogueado, puedeVerTodo, usuarioActivoId, diasSemana],
  );

  useEffect(() => {
    cargarSemana();
  }, [cargarSemana]);

  const filasSemana = useMemo(() => {
    const base = puedeVerTodo
      ? usuarios
          .filter((u) => u.activo)
          .map((u) => ({ id: u._id, nombre: u.nombre, rol: nombreRolDe(u) }))
      : usuarioLogueado
        ? [{ id: usuarioLogueado._id, nombre: usuarioLogueado.nombre, rol: usuarioLogueado.rol || "—" }]
        : [];

    // Incluye a quien tenga marcas esta semana aunque ya no figure en el personal activo
    const ids = new Set(base.map((e) => e.id));
    marcasSemana.forEach((m) => {
      const u = m.usuario_id;
      if (u?._id && !ids.has(u._id)) {
        ids.add(u._id);
        base.push({ id: u._id, nombre: u.nombre, rol: nombreRolDe(u) });
      }
    });

    return base
      .map((emp) => {
        const dias = {};
        let total = 0;

        marcasSemana
          .filter((m) => m.usuario_id?._id === emp.id && m.estado !== "Rechazada")
          .forEach((m) => {
            const dia = (dias[m.fecha] = dias[m.fecha] || {
              horas: 0,
              pendiente: false,
              sinSalida: false,
              enCurso: false,
            });
            const horas = Number(m.horas_trabajadas) || 0;
            dia.horas += horas;
            total += horas;
            if (ESTADOS_PENDIENTES.includes(m.estado)) dia.pendiente = true;
            if (!m.hora_salida) {
              if (m.fecha === hoy) dia.enCurso = true;
              else dia.sinSalida = true;
            }
          });

        return { ...emp, dias, total, diasTrabajados: Object.keys(dias).length };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [puedeVerTodo, usuarios, usuarioLogueado, marcasSemana, hoy]);

  const totalesDia = useMemo(
    () =>
      diasSemana.map((fecha) =>
        filasSemana.reduce((acc, emp) => acc + (emp.dias[fecha]?.horas || 0), 0),
      ),
    [filasSemana, diasSemana],
  );
  const totalSemana = totalesDia.reduce((a, b) => a + b, 0);

  const mostrarError = (mensaje, titulo = "No se pudo completar la acción") =>
    showToast({ type: "error", title: titulo, message: mensaje });

  // --- Sesión ---
  useEffect(() => {
    (async () => {
      try {
        const resultado = await obtenerSesion();
        const datos = extraerDatos(resultado, null); // { usuario: {...} }
        setUsuarioLogueado(normalizarUsuario(datos));
      } catch (err) {
        setErrorCarga({
          tipo: "sesion",
          mensaje: "No se pudo cargar la sesión. Inicia sesión de nuevo.",
        });
      } finally {
        setCargandoSesion(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!usuarioLogueado || puedeVerTodo) return;
    setFiltroUsuario(usuarioActivoId);
    setFormNueva((p) => ({ ...p, usuario_id: usuarioActivoId }));
  }, [usuarioLogueado, puedeVerTodo, usuarioActivoId]);

  // silencioso = true: refresca los datos sin mostrar el indicador de carga de la tabla
  const cargarMarcasYResumen = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!usuarioLogueado) return;
      if (!silencioso) setCargandoMarcas(true);
      setErrorCarga((p) => (p?.tipo === "marcas" ? null : p));

      try {
        const [resMarcas, resResumen, resJornada, resHoy] = await Promise.all([
          obtenerMarcas({
            fecha: filtroFecha || undefined,
            usuario_id: puedeVerTodo ? filtroUsuario || undefined : usuarioActivoId,
          }),
          obtenerResumenMarcas(),
          obtenerJornadaActiva(),
          obtenerMarcas({ fecha: hoyISO(), usuario_id: usuarioActivoId }),
        ]);

        setMarcas(extraerDatos(resMarcas, []));
        setResumen(extraerDatos(resResumen, RESUMEN_VACIO));
        setJornadaActiva(extraerDatos(resJornada, null));
        setMarcasHoyPropias(extraerDatos(resHoy, []));

        if (puedeVerTodo) {
          const resPendientes = await obtenerMarcasPendientes();
          setPendientes(extraerDatos(resPendientes, []));
        }
      } catch (err) {
        setErrorCarga({
          tipo: "marcas",
          mensaje: err.message || "No se pudieron cargar las marcas.",
        });
      } finally {
        setCargandoMarcas(false);
      }
    },
    [usuarioLogueado, puedeVerTodo, filtroFecha, filtroUsuario, usuarioActivoId],
  );

  useEffect(() => {
    cargarMarcasYResumen();
  }, [cargarMarcasYResumen]);

  // Refresca tabla, resúmenes y hoja semanal sin mostrar indicadores de carga
  const refrescar = () =>
    Promise.all([cargarMarcasYResumen({ silencioso: true }), cargarSemana({ silencioso: true })]);

  useEffect(() => {
    if (!puedeVerTodo) return;
    (async () => {
      try {
        const resultado = await listarPersonal();
        setUsuarios(extraerDatos(resultado, []));
      } catch (err) {
        mostrarError("No se pudo cargar la lista de empleados.", "Empleados no disponibles");
      }
    })();
  }, [puedeVerTodo]);

  const iniciarJornada = async () => {
    if (jornadaActiva) {
      showToast({ type: "warning", title: "Jornada activa", message: "Ya tienes una jornada activa." });
      return;
    }
    setCargandoAccion(true);
    try {
      await iniciarJornadaApi();
      await refrescar();
      showToast({
        type: "success",
        title: "Jornada iniciada",
        message: "Tu hora de entrada fue registrada correctamente.",
      });
    } catch (err) {
      mostrarError(err.message || "No se pudo iniciar la jornada.", "Error al iniciar");
    } finally {
      setCargandoAccion(false);
    }
  };

  const finalizarJornada = async () => {
    if (!jornadaActiva) {
      showToast({ type: "warning", title: "Sin jornada", message: "No tienes una jornada activa." });
      return;
    }
    setCargandoAccion(true);
    try {
      await finalizarJornadaApi();
      await refrescar();
      showToast({
        type: "success",
        title: "Jornada finalizada",
        message: "Tu hora de salida fue registrada correctamente.",
      });
    } catch (err) {
      mostrarError(err.message || "No se pudo finalizar la jornada.", "Error al finalizar");
    } finally {
      setCargandoAccion(false);
    }
  };

  const abrirJustificacion = (marca) => {
    if (marca.usuario_id?._id !== usuarioActivoId) {
      showToast({
        type: "warning",
        title: "Acción no permitida",
        message: "No puedes justificar marcas de otro usuario.",
      });
      return;
    }
    setMarcaJustificando(marca);
    setFormJustificacion({
      tipo: !marca.hora_salida ? "Olvidó marcar salida" : "Corrección de marca",
      hora_sugerida: marca.hora_salida || "",
      motivo: "",
    });
    setMostrarModalJustificacion(true);
  };

  const guardarJustificacion = async (e) => {
    e.preventDefault();
    if (!formJustificacion.motivo.trim()) {
      showToast({
        type: "warning",
        title: "Datos incompletos",
        message: "Debes indicar el motivo de la justificación.",
      });
      return;
    }
    setGuardando(true);
    try {
      await justificarMarcaApi(marcaJustificando._id, formJustificacion);
      setMostrarModalJustificacion(false);
      setMarcaJustificando(null);
      setFormJustificacion({ tipo: "Olvidó marcar salida", hora_sugerida: "", motivo: "" });
      await refrescar();
      showToast({
        type: "success",
        title: "Justificación registrada",
        message: "La justificación fue enviada para su revisión.",
      });
    } catch (err) {
      mostrarError(err.message || "No se pudo guardar la justificación.", "Error al justificar");
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarManual = async (e) => {
    e.preventDefault();
    const usuarioIdObjetivo = puedeVerTodo ? formNueva.usuario_id : usuarioActivoId;

    if (!usuarioIdObjetivo) {
      showToast({ type: "warning", title: "Datos incompletos", message: "Debes seleccionar un empleado." });
      return;
    }

    const horas = calcularHoras(formNueva.hora_entrada, formNueva.hora_salida);
    if (horas <= 0) {
      showToast({
        type: "warning",
        title: "Horario no válido",
        message: "La hora de salida debe ser mayor a la hora de entrada.",
      });
      return;
    }
    if (!formNueva.observaciones.trim()) {
      showToast({
        type: "warning",
        title: "Datos incompletos",
        message: "Las marcas manuales requieren una observación.",
      });
      return;
    }

    setGuardando(true);
    try {
      await crearMarcaManual({ ...formNueva, usuario_id: usuarioIdObjetivo });
      setFormNueva({
        usuario_id: puedeVerTodo ? "" : usuarioActivoId,
        fecha: hoyISO(),
        hora_entrada: "",
        hora_salida: "",
        observaciones: "",
      });
      setMostrarModal(false);
      await refrescar();
      showToast({
        type: "success",
        title: "Marca manual registrada",
        message: "La solicitud fue guardada correctamente.",
      });
    } catch (err) {
      mostrarError(err.message || "No se pudo guardar la marca manual.", "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const resolverPendiente = async (id, accion) => {
    setCargandoAccion(true);
    try {
      if (accion === "aprobar") await aprobarMarcaApi(id);
      else await rechazarMarcaApi(id);
      await refrescar();
      showToast({
        type: "success",
        title: accion === "aprobar" ? "Marca aprobada" : "Marca rechazada",
        message:
          accion === "aprobar"
            ? "La marca fue aprobada y sus horas se contabilizan."
            : "La marca fue rechazada.",
      });
    } catch (err) {
      mostrarError(err.message || "No se pudo actualizar la marca.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroFecha("");
    if (puedeVerTodo) setFiltroUsuario("");
  };

  const horasManual = calcularHoras(formNueva.hora_entrada, formNueva.hora_salida);
  const mostrarPendientes = puedeVerTodo && pendientes.length > 0;

  // Mi jornada: si hay jornada activa se muestra esa; si no, la última jornada de hoy tomada de las marcas
  const fuenteJornada = jornadaActiva || ultimaMarcaHoy;
  const mostrandoUltima = !jornadaActiva && Boolean(ultimaMarcaHoy);
  const entradaMostrada = fuenteJornada?.hora_entrada || "—";
  const salidaMostrada = jornadaActiva
    ? jornadaActiva.hora_salida || "—"
    : ultimaMarcaHoy?.hora_salida || "—";
  const fechaMostrada = fuenteJornada?.fecha || hoyISO();

  if (cargandoSesion) {
    return (
      <div className="flex overflow-hidden h-screen bg-[#f9f9ff]">
        <Sidebar activeItem="control-marcas" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="loading loading-spinner loading-lg text-[#006686]" />
            <p className="text-sm text-[#3f484e]">Cargando sesión…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{ top: 24, right: 24 }}
        toastOptions={{
          removeDelay: 600,
          style: { background: "transparent", boxShadow: "none", padding: 0 },
        }}
      />
      <Sidebar activeItem="control-marcas" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          {/* ── Encabezado ── */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                Control de Marcas
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                {puedeVerTodo
                  ? "Registro automático de entrada, salida y horas trabajadas de todo el personal."
                  : "Registro automático de tu entrada, salida y horas trabajadas."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <RelojCostaRica />
              <button
                type="button"
                onClick={() => setMostrarModal(true)}
                className="px-6 py-3 bg-white border border-[#bec8ce] text-[#3f484e] rounded-full text-xs font-semibold hover:border-[#006686] hover:text-[#006686] transition-colors flex items-center gap-2"
              >
                <PencilLine size={16} />
                Agregar marca manual
              </button>
            </div>
          </div>

          {errorCarga && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6]/40 px-4 py-3 text-sm text-[#ba1a1a]">
              <span className="flex items-center gap-2">
                <AlertTriangle size={16} />
                {errorCarga.mensaje}
              </span>
              {errorCarga.tipo === "marcas" ? (
                <button
                  type="button"
                  onClick={() => cargarMarcasYResumen()}
                  className="font-semibold underline"
                >
                  Reintentar
                </button>
              ) : (
                <Link to="/login" className="font-semibold underline">
                  Iniciar sesión
                </Link>
              )}
            </div>
          )}

          {/* ── Mi jornada + resúmenes ── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            <div className="xl:col-span-4 flex flex-col gap-5">
            <section
              className={`bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm flex flex-col ${
                mostrarPendientes ? "" : "flex-1"
              }`}
            >
              <SectionHeader
                icon={Timer}
                title="Mi jornada"
                subtitle="Marca entrada y salida del usuario en sesión."
                right={<EstadoJornada activa={Boolean(jornadaActiva)} />}
              />

              <div className="flex items-center gap-3 rounded-xl border border-[#bec8ce] bg-[#f9f9ff] p-3 mb-4">
                <Avatar nombre={usuarioLogueado?.nombre} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                    Usuario en sesión
                  </p>
                  <p className="text-sm font-bold text-[#151c27] truncate">
                    {usuarioLogueado?.nombre || "Usuario no identificado"}
                  </p>
                  <p className="text-xs text-[#3f484e]">{usuarioLogueado?.rol || "Sin rol"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#bec8ce] bg-[#f0f3ff] p-5 mb-4 flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider text-center">
                  Tiempo activo
                </p>
                <p
                  className={`text-4xl font-bold tracking-tight text-center mt-1 ${
                    jornadaActiva ? "text-[#006686]" : "text-[#151c27]"
                  }`}
                >
                  {jornadaActiva ? (
                    <TiempoActivo inicio={jornadaActiva.inicio_at} />
                  ) : (
                    "00h 00m"
                  )}
                </p>

                {mostrandoUltima && (
                  <p className="mt-4 text-center text-[11px] font-semibold text-[#006686]">
                    Última jornada de hoy
                  </p>
                )}
                <div className={`${mostrandoUltima ? "mt-2" : "mt-4"} grid grid-cols-2 gap-3`}>
                  <div className="bg-white rounded-xl p-3 border border-[#bec8ce]/60">
                    <p className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[#3f484e]">
                      <LogIn size={12} />
                      Entrada
                    </p>
                    <p className="font-mono font-bold text-[#151c27] mt-0.5">
                      {entradaMostrada}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-[#bec8ce]/60">
                    <p className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[#3f484e]">
                      <LogOut size={12} />
                      Salida
                    </p>
                    <p className="font-mono font-bold text-[#151c27] mt-0.5">
                      {salidaMostrada}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-[#bec8ce]/60">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[#3f484e]">
                    <CalendarDays size={12} />
                    Fecha
                  </p>
                  <p className="font-bold text-[#151c27]">{fechaMostrada}</p>
                </div>

                {jornadasHoy.length > 1 && (
                  <div className="mt-3 rounded-xl border border-[#bec8ce]/60 bg-white p-3">
                    <p className="text-[10px] uppercase font-semibold text-[#3f484e] mb-2">
                      Jornadas de hoy ({jornadasHoy.length})
                    </p>
                    <ul className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {jornadasHoy.map((m) => {
                        const enCurso =
                          Boolean(jornadaActiva) &&
                          !m.hora_salida &&
                          (m._id === jornadaActiva._id || m.hora_entrada === jornadaActiva.hora_entrada);
                        return (
                          <li key={m._id} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[#151c27]">
                              {m.hora_entrada} → {m.hora_salida || "—"}
                            </span>
                            <span
                              className={`font-semibold ${
                                m.hora_salida ? "text-[#006686]" : enCurso ? "text-[#006b5f]" : "text-[#855300]"
                              }`}
                            >
                              {m.hora_salida
                                ? `${Number(m.horas_trabajadas || 0).toFixed(2)}h`
                                : enCurso
                                  ? "En curso"
                                  : "Sin salida"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={iniciarJornada}
                  disabled={!usuarioActivoId || Boolean(jornadaActiva) || cargandoAccion}
                  className="px-4 py-3 rounded-full text-xs font-semibold bg-[#006686] text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Play size={15} />
                  Iniciar
                </button>
                <button
                  type="button"
                  onClick={finalizarJornada}
                  disabled={!jornadaActiva || cargandoAccion}
                  className="px-4 py-3 rounded-full text-xs font-semibold bg-[#ba1a1a] text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Square size={15} />
                  Finalizar
                </button>
              </div>
            </section>

              {mostrarPendientes && (
                <section className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm flex flex-col xl:flex-1 xl:min-h-0">
                  <SectionHeader
                    icon={ClipboardCheck}
                    tone="warning"
                    title={`Pendientes de aprobación (${pendientes.length})`}
                    subtitle="Marcas manuales y justificaciones por revisar"
                  />
                  {/* En pantallas grandes la lista ocupa el alto restante y hace scroll por dentro */}
                  <div className="xl:relative xl:flex-1 xl:min-h-[180px]">
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1 xl:absolute xl:inset-0 xl:max-h-none">
                      {pendientes.map((p) => (
                        <div
                          key={p._id}
                          className="rounded-xl border border-[#bec8ce] bg-[#f9f9ff] p-3.5"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <Avatar nombre={p.usuario_id?.nombre} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#151c27]">
                                {p.usuario_id?.nombre}{" "}
                                <span className="font-normal text-[#3f484e]">
                                  · {p.fecha} · {p.tipo_registro}
                                </span>
                              </p>
                              {(p.hora_entrada || p.hora_salida) && (
                                <p className="text-xs font-mono text-[#006686] mt-0.5">
                                  {p.hora_entrada || "—"} → {p.hora_salida || "—"}
                                </p>
                              )}
                              <p className="text-xs text-[#3f484e] mt-1">
                                {p.observaciones || p.justificacion?.motivo}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => resolverPendiente(p._id, "rechazar")}
                              disabled={cargandoAccion}
                              className="px-4 py-2 rounded-full border border-[#ba1a1a]/40 text-[#ba1a1a] text-xs font-semibold hover:bg-[#ffdad6] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <X size={14} />
                              Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={() => resolverPendiente(p._id, "aprobar")}
                              disabled={cargandoAccion}
                              className="px-4 py-2 rounded-full bg-[#006686] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <Check size={14} />
                              Aprobar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="xl:col-span-8 flex flex-col gap-5">
              <section className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
                <SectionHeader
                  icon={Activity}
                  tone="success"
                  title={puedeVerTodo ? "Resumen del día" : "Mi resumen del día"}
                  subtitle="Actividad registrada hoy"
                />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatTile
                    icon={Users}
                    tone="primary"
                    label={puedeVerTodo ? "En jornada" : "Mi jornada"}
                    value={resumen.enJornada}
                  />
                  <StatTile
                    icon={Timer}
                    tone="success"
                    label="Horas hoy"
                    value={`${Number(resumen.horasHoy || 0).toFixed(1)}h`}
                  />
                  <StatTile
                    icon={ListChecks}
                    tone="neutral"
                    label="Marcas hoy"
                    value={resumen.marcasHoy}
                  />
                  <StatTile
                    icon={PencilLine}
                    tone="warning"
                    label="Manuales"
                    value={resumen.marcasManuales}
                  />
                </div>
              </section>

              <section className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm flex flex-col flex-1">
                <SectionHeader
                  icon={CalendarDays}
                  title={puedeVerTodo ? "Horas de la semana" : "Mi semana"}
                  subtitle={rangoSemanaTexto(inicioSemana, diasSemana[6])}
                  right={
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] px-3 py-1 rounded-full">
                        Total {totalSemana.toFixed(1)}h
                      </span>
                      {semanaOffset !== 0 && (
                        <button
                          type="button"
                          onClick={() => setSemanaOffset(0)}
                          className="px-3 py-1.5 rounded-full border border-[#bec8ce] text-xs font-semibold text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors"
                        >
                          Esta semana
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Semana anterior"
                          onClick={() => setSemanaOffset((o) => o - 1)}
                          className="p-1.5 rounded-lg border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Semana siguiente"
                          disabled={semanaOffset >= 0}
                          onClick={() => setSemanaOffset((o) => Math.min(o + 1, 0))}
                          className="p-1.5 rounded-lg border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  }
                />

                {errorSemana && (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6]/40 px-4 py-2.5 text-sm text-[#ba1a1a]">
                    <span>No se pudieron cargar las horas de la semana.</span>
                    <button type="button" onClick={() => cargarSemana()} className="font-semibold underline">
                      Reintentar
                    </button>
                  </div>
                )}

                {cargandoSemana ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <span className="loading loading-spinner loading-md text-[#006686]" />
                    <p className="text-sm text-[#3f484e]">Cargando horas…</p>
                  </div>
                ) : filasSemana.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#bec8ce] bg-[#f9f9ff] p-5 text-sm text-[#3f484e] text-center">
                    No hay empleados para mostrar.
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto max-h-[26rem] rounded-xl border border-[#bec8ce]">
                      <table className="w-full text-left border-collapse min-w-[560px]">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#f0f3ff] border-b border-[#bec8ce]">
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                              Empleado
                            </th>
                            {diasSemana.map((fecha, i) => {
                              const esHoy = fecha === hoy;
                              return (
                                <th
                                  key={fecha}
                                  className={`px-2 py-2.5 text-center ${esHoy ? "bg-[#7dd3fc40]" : ""}`}
                                >
                                  <span
                                    className={`block text-[10px] font-semibold uppercase tracking-wider ${
                                      esHoy ? "text-[#006686]" : "text-[#3f484e]"
                                    }`}
                                  >
                                    {DIAS_CORTOS[i]}
                                  </span>
                                  <span
                                    className={`block text-xs font-bold ${
                                      esHoy ? "text-[#006686]" : "text-[#151c27]"
                                    }`}
                                  >
                                    {Number(fecha.slice(8))}
                                  </span>
                                </th>
                              );
                            })}
                            <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#bec8ce]/40">
                          {filasSemana.map((emp) => (
                            <tr key={emp.id} className="hover:bg-[#e7eefe]/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5 min-w-[150px]">
                                  <Avatar nombre={emp.nombre} size="sm" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#151c27] truncate max-w-[140px]">
                                      {emp.nombre}
                                    </p>
                                    <p className="text-[11px] text-[#3f484e]">{emp.rol}</p>
                                  </div>
                                </div>
                              </td>

                              {diasSemana.map((fecha, i) => {
                                const dato = emp.dias[fecha];
                                const esHoy = fecha === hoy;
                                const esFinde = i >= 5;
                                const indicador = dato?.sinSalida
                                  ? { cls: "bg-[#ba1a1a]", titulo: "Sin salida registrada" }
                                  : dato?.pendiente
                                    ? { cls: "bg-[#855300]", titulo: "Marca pendiente de aprobación" }
                                    : dato?.enCurso
                                      ? { cls: "bg-[#006b5f] animate-pulse", titulo: "Jornada en curso" }
                                      : null;

                                return (
                                  <td
                                    key={fecha}
                                    className={`px-2 py-3 text-center text-sm ${
                                      esHoy ? "bg-[#7dd3fc12]" : esFinde ? "bg-[#f9f9ff]" : ""
                                    }`}
                                  >
                                    {dato ? (
                                      <span
                                        className="relative inline-block font-semibold text-[#151c27]"
                                        title={indicador?.titulo}
                                      >
                                        {dato.horas.toFixed(1)}
                                        {indicador && (
                                          <span
                                            className={`absolute -top-1 -right-2.5 w-1.5 h-1.5 rounded-full ${indicador.cls}`}
                                          />
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-[#bec8ce]">—</span>
                                    )}
                                  </td>
                                );
                              })}

                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <p className="text-sm font-bold text-[#151c27]">{emp.total.toFixed(1)}h</p>
                                <p className="text-[11px] text-[#3f484e]">
                                  {emp.diasTrabajados} {emp.diasTrabajados === 1 ? "día" : "días"}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        {puedeVerTodo && filasSemana.length > 1 && (
                          <tfoot>
                            <tr className="bg-[#f9f9ff] border-t border-[#bec8ce]">
                              <td className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#3f484e]">
                                Total del día
                              </td>
                              {totalesDia.map((t, i) => (
                                <td
                                  key={diasSemana[i]}
                                  className="px-2 py-2.5 text-center text-xs font-bold text-[#151c27]"
                                >
                                  {t > 0 ? t.toFixed(1) : "—"}
                                </td>
                              ))}
                              <td className="px-4 py-2.5 text-right text-sm font-bold text-[#006686]">
                                {totalSemana.toFixed(1)}h
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-[#3f484e]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                        Sin salida registrada
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#855300]" />
                        Pendiente de aprobación
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006b5f]" />
                        Jornada en curso
                      </span>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>

          {/* ── Historial de marcas ── */}
          <section className="bg-white border border-[#bec8ce] rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 pb-0">
              <SectionHeader
                icon={History}
                title="Historial de marcas"
                subtitle={
                  puedeVerTodo
                    ? "Marcas registradas de todo el personal"
                    : "Tus marcas registradas"
                }
                right={
                  <span className="text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] px-3 py-1 rounded-full">
                    {marcas.length} {marcas.length === 1 ? "registro" : "registros"}
                  </span>
                }
              />

              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#bec8ce] bg-[#f9f9ff] p-3 mb-5">
                <div className="flex items-center gap-2 text-[#3f484e]">
                  <Filter size={16} />
                  <span className="text-sm font-semibold">Filtrar:</span>
                </div>

                <input
                  type="date"
                  aria-label="Filtrar por fecha"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="px-3 py-2 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
                />

                {puedeVerTodo && (
                  <select
                    aria-label="Filtrar por empleado"
                    value={filtroUsuario}
                    onChange={(e) => setFiltroUsuario(e.target.value)}
                    className="px-3 py-2 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
                  >
                    <option value="">Todos los empleados</option>
                    {usuarios.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                )}

                {(filtroFecha || (puedeVerTodo && filtroUsuario)) && (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="px-4 py-2 text-xs font-semibold text-[#3f484e] hover:bg-[#dce2f3] rounded-full transition-colors flex items-center gap-1"
                  >
                    <X size={14} />
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border-t border-[#bec8ce]">
              {cargandoMarcas ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <span className="loading loading-spinner loading-md text-[#006686]" />
                  <p className="text-sm text-[#3f484e]">Cargando marcas…</p>
                </div>
              ) : marcas.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex rounded-full bg-[#f0f3ff] p-4 text-[#bec8ce] mb-3">
                    <CalendarDays size={32} />
                  </div>
                  <p className="text-sm text-[#3f484e]">
                    No hay marcas para los filtros seleccionados.
                  </p>
                </div>
              ) : (
                <div className="max-h-[560px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#f0f3ff] border-b border-[#bec8ce]">
                        {[
                          "#",
                          ...(puedeVerTodo ? ["Empleado", "Rol"] : []),
                          "Fecha",
                          "Entrada",
                          "Salida",
                          "Horas",
                          "Tipo",
                          "Estado",
                          "Observaciones",
                          "Acciones",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#bec8ce]/40">
                      {marcas.map((marca, index) => {
                        const esPropia = marca.usuario_id?._id === usuarioActivoId;
                        return (
                          <tr key={marca._id} className="hover:bg-[#e7eefe]/30 transition-colors">
                            <td className="px-5 py-4 text-sm text-[#3f484e]">{index + 1}</td>

                            {puedeVerTodo && (
                              <>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar nombre={marca.usuario_id?.nombre} size="sm" />
                                    <span className="text-sm font-semibold text-[#151c27] whitespace-nowrap">
                                      {marca.usuario_id?.nombre}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dce2f3] text-[#3f484e] border border-[#bec8ce]">
                                    {nombreRolDe(marca.usuario_id)}
                                  </span>
                                </td>
                              </>
                            )}

                            <td className="px-5 py-4 text-sm text-[#3f484e] whitespace-nowrap capitalize">
                              {marca.fecha
                                ? new Date(marca.fecha + "T12:00:00").toLocaleDateString("es-CR", {
                                    weekday: "short",
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "—"}
                            </td>
                            <td className="px-5 py-4 font-mono text-sm text-[#151c27]">
                              {marca.hora_entrada || "—"}
                            </td>
                            <td className="px-5 py-4 font-mono text-sm text-[#151c27]">
                              {marca.hora_salida || "—"}
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm font-bold text-[#006686]">
                                {(marca.horas_trabajadas || 0).toFixed(2)}h
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <BadgeTipo tipo={marca.tipo_registro} />
                            </td>
                            <td className="px-5 py-4">
                              <BadgeEstado estado={marca.estado} />
                            </td>
                            <td
                              className="px-5 py-4 text-sm text-[#3f484e] max-w-[260px] truncate"
                              title={marca.observaciones || ""}
                            >
                              {marca.observaciones || "—"}
                            </td>
                            <td className="px-5 py-4">
                              {esPropia ? (
                                <button
                                  type="button"
                                  onClick={() => abrirJustificacion(marca)}
                                  className="px-3 py-1.5 rounded-full border border-[#bec8ce] text-xs font-semibold text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors flex items-center gap-1.5"
                                >
                                  <FileText size={13} />
                                  Justificar
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-[#9ca3af] whitespace-nowrap">
                                  <Lock size={12} />
                                  No permitido
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ── Modal: marca manual ── */}
      {mostrarModal && (
        <ModalShell
          id="modal-marca-manual"
          icon={PencilLine}
          titulo="Agregar marca manual"
          subtitulo={
            puedeVerTodo
              ? "Úsalo solo si un administrador debe registrar una jornada completa."
              : "Registra manualmente una jornada tuya que no se marcó a tiempo."
          }
          onClose={() => setMostrarModal(false)}
        >
          <form
            className="flex flex-col min-h-0"
            onSubmit={handleGuardarManual}
            autoComplete="off"
          >
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <Label htmlFor="mm-empleado">Empleado *</Label>
                {puedeVerTodo ? (
                  <select
                    id="mm-empleado"
                    value={formNueva.usuario_id}
                    onChange={(e) => setFormNueva((p) => ({ ...p, usuario_id: e.target.value }))}
                    required
                    className={inputCls}
                  >
                    <option value="">Seleccionar empleado</option>
                    {usuarios
                      .filter((u) => u.activo)
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.nombre} ({nombreRolDe(u)})
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-3 w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm bg-[#f0f3ff] text-[#151c27]">
                    <Avatar nombre={usuarioLogueado?.nombre} size="sm" />
                    {usuarioLogueado?.nombre} ({usuarioLogueado?.rol})
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="mm-fecha">Fecha *</Label>
                <input
                  id="mm-fecha"
                  type="date"
                  value={formNueva.fecha}
                  onChange={(e) => setFormNueva((p) => ({ ...p, fecha: e.target.value }))}
                  required
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mm-entrada">Hora entrada *</Label>
                  <input
                    id="mm-entrada"
                    type="time"
                    value={formNueva.hora_entrada}
                    onChange={(e) =>
                      setFormNueva((p) => ({ ...p, hora_entrada: e.target.value }))
                    }
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="mm-salida">Hora salida *</Label>
                  <input
                    id="mm-salida"
                    type="time"
                    value={formNueva.hora_salida}
                    onChange={(e) =>
                      setFormNueva((p) => ({ ...p, hora_salida: e.target.value }))
                    }
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              {formNueva.hora_entrada && formNueva.hora_salida && (
                <div
                  className={`rounded-lg border p-3 flex items-center gap-2 text-sm ${
                    horasManual > 0
                      ? "bg-[#7dd3fc20] border-[#006686]/20 text-[#006686]"
                      : "bg-[#ffdad6]/40 border-[#ba1a1a]/20 text-[#ba1a1a]"
                  }`}
                >
                  <Timer size={16} />
                  <span>
                    Horas calculadas: <strong>{horasManual.toFixed(2)} horas</strong>
                  </span>
                  {horasManual <= 0 && (
                    <span className="ml-auto text-xs">Salida debe ser mayor a la entrada</span>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="mm-justificacion">Justificación *</Label>
                <textarea
                  id="mm-justificacion"
                  placeholder="Ej: Se registra manualmente porque el empleado olvidó marcar la jornada completa."
                  value={formNueva.observaciones}
                  onChange={(e) =>
                    setFormNueva((p) => ({ ...p, observaciones: e.target.value }))
                  }
                  required
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            <ModalFooter
              onCancel={() => setMostrarModal(false)}
              guardando={guardando}
              textoGuardar="Guardar solicitud"
            />
          </form>
        </ModalShell>
      )}

      {/* ── Modal: justificar marca ── */}
      {mostrarModalJustificacion && marcaJustificando && (
        <ModalShell
          id="modal-justificar"
          icon={FileText}
          titulo="Justificar marca"
          subtitulo="Registra el motivo por el cual esta marca necesita revisión."
          onClose={() => setMostrarModalJustificacion(false)}
        >
          <form className="flex flex-col min-h-0" onSubmit={guardarJustificacion}>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-3 rounded-xl bg-[#f0f3ff] border border-[#bec8ce] p-4">
                <Avatar nombre={marcaJustificando.usuario_id?.nombre} />
                <div>
                  <p className="text-sm font-semibold text-[#151c27]">
                    {marcaJustificando.usuario_id?.nombre}
                  </p>
                  <p className="text-xs text-[#3f484e] mt-0.5">
                    Entrada: {marcaJustificando.hora_entrada || "—"} · Salida:{" "}
                    {marcaJustificando.hora_salida || "Sin salida registrada"}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="j-tipo">Tipo de justificación *</Label>
                <select
                  id="j-tipo"
                  value={formJustificacion.tipo}
                  onChange={(e) =>
                    setFormJustificacion((p) => ({ ...p, tipo: e.target.value }))
                  }
                  className={inputCls}
                >
                  {TIPOS_JUSTIFICACION.map((tipo) => (
                    <option key={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="j-hora">Hora sugerida</Label>
                <input
                  id="j-hora"
                  type="time"
                  value={formJustificacion.hora_sugerida}
                  onChange={(e) =>
                    setFormJustificacion((p) => ({ ...p, hora_sugerida: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <Label htmlFor="j-motivo">Motivo *</Label>
                <textarea
                  id="j-motivo"
                  value={formJustificacion.motivo}
                  onChange={(e) =>
                    setFormJustificacion((p) => ({ ...p, motivo: e.target.value }))
                  }
                  placeholder="Ej: La asistente olvidó marcar salida porque estaba atendiendo una emergencia."
                  required
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            <ModalFooter
              onCancel={() => setMostrarModalJustificacion(false)}
              guardando={guardando}
              textoGuardar="Guardar justificación"
            />
          </form>
        </ModalShell>
      )}
    </div>
  );
};

export default ControlMarcas;