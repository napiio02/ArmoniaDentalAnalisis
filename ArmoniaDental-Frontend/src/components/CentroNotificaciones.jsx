import toast, { Toaster } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

const CONFIGURACION = {
  success: {
    icono: CheckCircle2,
    borde: "border-[#6df5e1]/30",
    fondoIcono: "bg-[#6df5e120]",
    colorIcono: "text-[#006b5f]",
    progreso: "bg-[#006b5f]",
  },
  error: {
    icono: XCircle,
    borde: "border-[#ba1a1a]/20",
    fondoIcono: "bg-[#ffdad6]/50",
    colorIcono: "text-[#ba1a1a]",
    progreso: "bg-[#ba1a1a]",
  },
  warning: {
    icono: AlertTriangle,
    borde: "border-[#855300]/20",
    fondoIcono: "bg-[#ffddb820]",
    colorIcono: "text-[#855300]",
    progreso: "bg-[#855300]",
  },
  info: {
    icono: Info,
    borde: "border-[#006686]/20",
    fondoIcono: "bg-[#7dd3fc20]",
    colorIcono: "text-[#006686]",
    progreso: "bg-[#006686]",
  },
};

export const mostrarNotificacion = ({
  tipo = "info",
  titulo,
  mensaje,
}) => {
  const configuracion = CONFIGURACION[tipo] || CONFIGURACION.info;
  const Icono = configuracion.icono;

  toast.custom(
    (notificacion) => (
      <div
        className={`relative min-w-[320px] max-w-[430px] overflow-hidden rounded-2xl border bg-white shadow-xl transition-all duration-500 ${configuracion.borde} ${
          notificacion.visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="flex gap-4 p-5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${configuracion.fondoIcono} ${configuracion.colorIcono}`}
          >
            <Icono size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-[#151c27]">
              {titulo}
            </h3>
            <p className="mt-1 text-[13px] text-[#3f484e]">{mensaje}</p>
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(notificacion.id)}
            className="text-[#bec8ce] transition hover:text-[#3f484e]"
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
        <div className="h-[3px] w-full bg-[#f0f3ff]">
          <div
            className={`h-full ${configuracion.progreso} animate-[toastbar_4.2s_linear_forwards]`}
          />
        </div>
      </div>
    ),
    { duration: 4200 },
  );
};

export default function CentroNotificaciones() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ top: 24, right: 24 }}
      toastOptions={{
        removeDelay: 600,
        style: { background: "transparent", boxShadow: "none", padding: 0 },
      }}
    />
  );
}
