import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getCitas } from "../services/citaService";
import Sidebar from "../components/Sidebar";

const VERSION = "v1";
const BASE_URL = `http://localhost:3000/${VERSION}`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const formatearTiempoRelativo = (fecha) => {
  const ahora = new Date();
  const diff = Math.floor((ahora - new Date(fecha)) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
};

const formatearFechaHora = (fecha) =>
  new Date(fecha).toLocaleDateString("es-CR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const Home = () => {
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasMes, setCitasMes] = useState(0);
  const [proximaCita, setProximaCita] = useState(null);
  const [insumosStockBajo, setInsumosStockBajo] = useState(0);
  const [pacientesActivos, setPacientesActivos] = useState(null);
  const [nuevosEsteMes, setNuevosEsteMes] = useState(null);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const hoy = new Date();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const headers = getAuthHeaders();

        // ── Sesión del usuario ──
        const resSesion = await fetch(`${BASE_URL}/auth/me`, {
          headers,
          credentials: "include",
        });
        if (resSesion.ok) {
          const sesion = await resSesion.json();
          setUsuario(sesion.data?.usuario || null);
        }

        // ── Citas ──
        const todasLasCitas = await getCitas({ pasadas: "true" });

        const citasDeHoy = todasLasCitas.filter((c) => {
          const f = new Date(c.fecha_hora);
          return (
            f.getFullYear() === hoy.getFullYear() &&
            f.getMonth() === hoy.getMonth() &&
            f.getDate() === hoy.getDate()
          );
        });
        setCitasHoy(citasDeHoy);

        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDiaMes = new Date(
          hoy.getFullYear(),
          hoy.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        const delMes = todasLasCitas.filter((c) => {
          const f = new Date(c.fecha_hora);
          return (
            f >= primerDiaMes &&
            f <= ultimoDiaMes &&
            c.estado !== "Cancelada" &&
            c.estado !== "No asistió"
          );
        });
        setCitasMes(delMes.length);

        // Próxima cita — la más cercana en el futuro con estado activo
        const ahora = new Date();
        const futuras = todasLasCitas
          .filter(
            (c) =>
              new Date(c.fecha_hora) > ahora &&
              !["Cancelada", "No asistió", "Atendida"].includes(c.estado),
          )
          .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
        setProximaCita(futuras[0] || null);

        // ── Insumos con stock bajo ──
        const resInsumos = await fetch(`${BASE_URL}/insumos`, {
          headers,
          credentials: "include",
        });
        if (resInsumos.ok) {
          const insumos = await resInsumos.json();
          const lista = Array.isArray(insumos) ? insumos : (insumos.data ?? []);
          setInsumosStockBajo(
            lista.filter((i) => i.activo && i.stock_actual <= i.stock_minimo)
              .length,
          );
        }

        // ── Stats de pacientes ──
        const resPacientes = await fetch(`${BASE_URL}/pacientes/stats`, {
          headers,
          credentials: "include",
        });
        if (resPacientes.ok) {
          const stats = await resPacientes.json();
          setPacientesActivos(stats.data?.total ?? null);
          setNuevosEsteMes(stats.data?.nuevosEsteMes ?? null);
        }

        // ── Actividad reciente ──
        const resActividad = await fetch(`${BASE_URL}/actividad-reciente`, {
          headers,
          credentials: "include",
        });
        if (resActividad.ok) {
          const actividad = await resActividad.json();
          setActividadReciente(actividad.data || []);
        }
      } catch (err) {
        console.error("Error al cargar datos del home:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const formatearHora = (fecha) =>
    new Date(fecha).toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getInitials = (nombre = "") =>
    nombre
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getBadgeEstado = (estado) => {
    const map = {
      Confirmada: "bg-green-100 text-green-700",
      "En atención": "bg-blue-100 text-blue-700",
      Programada: "bg-yellow-100 text-yellow-700",
      Cancelada: "bg-red-100 text-red-700",
      Atendida: "bg-gray-100 text-gray-600",
    };
    return map[estado] || "bg-gray-100 text-gray-600";
  };

  const ACCESOS_RAPIDOS = [
    { icon: "add_circle", label: "Nueva Cita", to: "/citas", primary: true },
    { icon: "badge", label: "Expedientes", to: "/expedientes", primary: false },
    {
      icon: "inventory_2",
      label: "Inventario",
      to: "/inventario",
      primary: false,
    },
    { icon: "assessment", label: "Reportes", to: "/reportes", primary: false },
    { icon: "people", label: "Pacientes", to: "/pacientes", primary: false },
  ];

  const nombreUsuario = usuario?.nombre ? usuario.nombre.split(" ")[0] : "—";

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="home" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                {getSaludo()}
                {usuario ? `, ${nombreUsuario}` : ""}
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Bienvenido de nuevo, esto es lo que está sucediendo hoy.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/citas"
                className="px-6 py-2.5 bg-white text-[#151c27] rounded-full text-xs font-semibold hover:bg-[#f0f3ff] transition-colors border border-[#bec8ce]"
              >
                Ver Agenda
              </Link>
              <Link
                to="/citas"
                className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                Nueva Cita
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pacientes activos */}
            <div className="bg-white p-4 border border-[#bec8ce] rounded-xl shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#006686] bg-[#7dd3fc20] p-2 rounded-lg">
                  people
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Pacientes Activos
                </p>
                <p className="text-[22px] font-semibold text-[#151c27]">
                  {cargando ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    (pacientesActivos ?? "—")
                  )}
                </p>
              </div>
            </div>

            {/* Nuevos este mes */}
            <div className="bg-white p-4 border border-[#bec8ce] rounded-xl shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#006686] bg-[#7dd3fc20] p-2 rounded-lg">
                  person_add
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Nuevos este mes
                </p>
                <p className="text-[22px] font-semibold text-[#151c27]">
                  {cargando ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    (nuevosEsteMes ?? "—")
                  )}
                </p>
              </div>
            </div>

            {/* Próxima cita */}
            <div className="bg-white p-4 border border-[#bec8ce] rounded-xl shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#006686] bg-[#7dd3fc20] p-2 rounded-lg">
                  event_upcoming
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Próxima Cita
                </p>
                {cargando ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : proximaCita ? (
                  <>
                    <p className="text-sm font-semibold text-[#151c27] truncate">
                      {proximaCita.paciente_id?.nombre || "Paciente"}
                    </p>
                    <p className="text-[10px] text-[#3f484e]">
                      {formatearFechaHora(proximaCita.fecha_hora)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[#bec8ce]">Sin citas próximas</p>
                )}
              </div>
            </div>

            {/* Citas este mes */}
            <div className="bg-white p-4 border border-[#bec8ce] rounded-xl shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#006686] bg-[#7dd3fc20] p-2 rounded-lg">
                  event_available
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Citas este mes
                </p>
                <p className="text-[22px] font-semibold text-[#151c27]">
                  {cargando ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    citasMes
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Bento layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left col */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              {/* Accesos rápidos */}
              <div className="grid grid-cols-5 gap-4">
                {ACCESOS_RAPIDOS.map(({ icon, label, to, primary }) => (
                  <Link
                    key={label}
                    to={to}
                    className={`rounded-xl p-4 flex flex-col items-center justify-center text-center hover:scale-105 transition-all cursor-pointer group h-32 ${
                      primary
                        ? "bg-[#7dd3fc20] border border-[#006686]/20 hover:bg-[#7dd3fc40]"
                        : "bg-white border border-[#bec8ce] hover:border-[#006686]"
                    }`}
                  >
                    <span className="material-symbols-outlined mb-2 text-3xl transition-transform group-hover:scale-110 text-[#006686]">
                      {icon}
                    </span>
                    <p
                      className={`text-xs font-bold ${primary ? "text-[#006686]" : "text-[#151c27]"}`}
                    >
                      {label}
                    </p>
                  </Link>
                ))}
              </div>

              {/* Citas de hoy */}
              <div className="bg-white border border-[#bec8ce] rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#151c27]">
                    Citas de Hoy
                  </h3>
                  <Link
                    to="/citas"
                    className="text-[#006686] text-xs font-semibold hover:underline"
                  >
                    Ver Todas
                  </Link>
                </div>

                {cargando ? (
                  <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-lg text-[#006686]" />
                  </div>
                ) : citasHoy.length === 0 ? (
                  <div className="text-center py-8 text-[#3f484e] text-sm">
                    <span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">
                      event_busy
                    </span>
                    No hay citas programadas para hoy
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-4 pb-2 border-b border-[#bec8ce] mb-2">
                      {["Paciente", "Hora", "Tratamiento", "Estado"].map(
                        (h) => (
                          <p
                            key={h}
                            className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider"
                          >
                            {h}
                          </p>
                        ),
                      )}
                    </div>
                    <div className="space-y-2">
                      {citasHoy.slice(0, 5).map((cita) => (
                        <div
                          key={cita._id}
                          className="grid grid-cols-4 gap-4 items-center py-2 hover:bg-[#f0f3ff] rounded-lg px-2 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-[#e7eefe] flex items-center justify-center text-[#006686] text-xs font-bold flex-shrink-0">
                              {getInitials(cita.paciente_id?.nombre)}
                            </div>
                            <span className="text-sm font-semibold text-[#151c27] truncate">
                              {cita.paciente_id?.nombre ?? "Paciente"}
                            </span>
                          </div>
                          <span className="text-sm text-[#3f484e]">
                            {formatearHora(cita.fecha_hora)}
                          </span>
                          <span className="text-sm text-[#3f484e] truncate">
                            {cita.tipo}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${getBadgeEstado(cita.estado)}`}
                          >
                            {cita.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right col */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Alertas stock */}
              <div className="bg-white border border-[#bec8ce] rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-[#151c27]">
                    Alertas de Stock
                  </h3>
                  {insumosStockBajo > 0 && (
                    <span className="text-[10px] font-bold bg-[#ba1a1a] text-white px-2 py-0.5 rounded-full">
                      STOCK BAJO
                    </span>
                  )}
                </div>
                {cargando ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md text-[#006686]" />
                  </div>
                ) : insumosStockBajo === 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#006b5f] text-[20px]">
                      check_circle
                    </span>
                    <p className="text-sm text-[#3f484e]">
                      No hay alertas de stock actualmente.
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-[#ffdad620] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#ba1a1a]">
                          healing
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#151c27]">
                          Insumos con stock bajo
                        </p>
                        <p className="text-[10px] text-[#ba1a1a] font-bold uppercase">
                          {insumosStockBajo} artículo(s) afectados
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/inventario"
                      className="text-[#006686] text-xs font-semibold px-3 py-1 border border-[#006686] rounded-full hover:bg-[#006686]/5 transition-colors"
                    >
                      Ver
                    </Link>
                  </div>
                )}
              </div>

              {/* Actividad reciente */}
              <div className="bg-white border border-[#bec8ce] rounded-xl p-6">
                <h3 className="text-base font-semibold text-[#151c27] mb-4">
                  Actividad Reciente
                </h3>
                {cargando ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md text-[#006686]" />
                  </div>
                ) : actividadReciente.length === 0 ? (
                  <p className="text-sm text-[#3f484e]">
                    No hay actividad reciente registrada.
                  </p>
                ) : (
                  <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#bec8ce]">
                    {actividadReciente.map((item, i) => (
                      <div key={i} className="relative">
                        <div
                          className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? "bg-[#006686]" : "bg-[#bec8ce]"}`}
                        />
                        <p className="text-[10px] text-[#3f484e] mb-1">
                          {formatearTiempoRelativo(item.fecha)}
                        </p>
                        <p className="text-sm text-[#151c27]">
                          <span className="font-bold text-[#006b5f]">
                            {item.paciente}
                          </span>
                          {" — "}
                          {item.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info usuario */}
              <div className="bg-[#006686] rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-12">
                  <span
                    className="material-symbols-outlined text-[120px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    dentistry
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-1 relative z-10">
                  {usuario?.nombre || "Usuario"}
                </h4>
                <p className="text-sm text-white/70 mb-1 relative z-10">
                  {usuario?.email || ""}
                </p>
                <p className="text-xs text-white/60 relative z-10 inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    badge
                  </span>
                  {usuario?.rol || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
