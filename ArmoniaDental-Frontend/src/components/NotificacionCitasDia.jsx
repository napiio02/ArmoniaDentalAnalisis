import { useEffect } from "react";
import { Link } from "react-router";

const formatearHora = (fecha) =>
  new Date(fecha).toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const getInitials = (nombre = "") =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const BADGE_ESTADO = {
  Confirmada: "bg-[#7dd3fc20] text-[#006686]",
  Programada: "bg-[#ffddb820] text-[#855300]",
  "En atención": "bg-[#dce2f3] text-[#3f484e]",
};

/**
 * Notificación del día al iniciar sesión.
 *
 * Props:
 *  - estado: "con-citas" | "sin-citas" | "error"
 *  - citas: citas del día del doctor, ya filtradas y ordenadas por hora
 *  - onCerrar: función para cerrar el modal
 */
const NotificacionCitasDia = ({ estado, citas = [], onCerrar }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  const esError = estado === "error";
  const sinCitas = estado === "sin-citas";

  const icono = esError ? "error" : sinCitas ? "event_busy" : "event_upcoming";
  const colorIcono = esError ? "text-[#ba1a1a]" : "text-[#006686]";
  const fondoIcono = esError ? "bg-[#ffdad6]" : "bg-[#7dd3fc20]";

  const titulo = esError
    ? "No se pudo generar la notificación"
    : sinCitas
      ? "No tienes citas programadas hoy"
      : `Tienes ${citas.length} ${citas.length === 1 ? "cita" : "citas"} hoy`;

  const subtitulo = esError
    ? "Ocurrió un problema al consultar tus citas. Puedes revisarlas directamente en la agenda."
    : sinCitas
      ? "Tu agenda está libre para el día de hoy."
      : new Date().toLocaleDateString("es-CR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-citas-titulo"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${fondoIcono}`}
            >
              <span className={`material-symbols-outlined ${colorIcono}`}>
                {icono}
              </span>
            </div>
            <div>
              <h3
                id="notif-citas-titulo"
                className="text-lg font-bold text-[#151c27] leading-tight"
              >
                {titulo}
              </h3>
              <p className="text-sm text-[#3f484e] mt-0.5 first-letter:uppercase">
                {subtitulo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar notificación"
            className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Listado de pacientes (solo con citas) */}
        {estado === "con-citas" && (
          <div className="space-y-2 overflow-y-auto pr-1 mb-5">
            {citas.map((cita) => (
              <div
                key={cita._id}
                className="flex items-center gap-3 border border-[#bec8ce] rounded-xl px-3 py-2.5"
              >
                <div className="w-9 h-9 rounded bg-[#e7eefe] flex items-center justify-center text-[#006686] text-xs font-bold flex-shrink-0">
                  {getInitials(cita.paciente_id?.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#151c27] truncate">
                    {cita.paciente_id?.nombre ?? "Paciente"}
                  </p>
                  <p className="text-xs text-[#3f484e] truncate">{cita.tipo}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-bold text-[#006686]">
                    {formatearHora(cita.fecha_hora)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      BADGE_ESTADO[cita.estado] || "bg-[#dce2f3] text-[#3f484e]"
                    }`}
                  >
                    {cita.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
          >
            Cerrar
          </button>
          <Link
            to="/citas"
            onClick={onCerrar}
            className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">
              calendar_month
            </span>
            Ver agenda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotificacionCitasDia;