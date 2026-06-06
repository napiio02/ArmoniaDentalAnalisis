import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getCitas } from "../services/citaService";
import Sidebar from "../components/Sidebar";

// ─── Home ──────────────────────────────────────────────────────
const Home = () => {
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasMes, setCitasMes] = useState(0);
  const [insumosStockBajo, setInsumosStockBajo] = useState(0);
  const [cargando, setCargando] = useState(true);
  const usuarioNombre = "Dra. Laura";

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
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

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
          return f >= primerDiaMes && f <= ultimoDiaMes;
        });
        setCitasMes(delMes.length);

        const resInsumos = await fetch("http://localhost:3000/v1/insumos", {
          headers,
        });
        if (resInsumos.ok) {
          const insumos = await resInsumos.json();
          const lista = Array.isArray(insumos) ? insumos : (insumos.data ?? []);
          const stockBajo = lista.filter(
            (i) => i.activo && i.stock_actual <= i.stock_minimo,
          ).length;
          setInsumosStockBajo(stockBajo);
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
      Pendiente: "bg-yellow-100 text-yellow-700",
      Cancelada: "bg-red-100 text-red-700",
    };
    return map[estado] || "bg-gray-100 text-gray-600";
  };

  const ACCESOS_RAPIDOS = [
    { icon: "add_circle", label: "Nueva Cita", to: "/citas", primary: true },
    { icon: "badge", label: "Expedientes", to: "/expedientes", primary: false },
    {
      icon: "account_balance_wallet",
      label: "Facturación",
      to: "/comprobantes",
      primary: false,
    },
    { icon: "assessment", label: "Reportes", to: "/reportes", primary: false },
    {
      icon: "medication",
      label: "Recetas",
      to: "/comprobantes",
      primary: false,
    },
  ];

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="citas" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                {getSaludo()}, {usuarioNombre}
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
                  person
                </span>
                <span className="text-[#006b5f] text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>{" "}
                  +12%
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Pacientes Activos
                </p>
                <p className="text-[22px] font-semibold text-[#151c27]">
                  1,284
                </p>
              </div>
            </div>

            {/* Citas del mes */}
            <div className="bg-white p-4 border border-[#bec8ce] rounded-xl shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#006686] bg-[#7dd3fc20] p-2 rounded-lg">
                  event_available
                </span>
                <span className="text-[#006b5f] text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>{" "}
                  +5%
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Citas Mensuales
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

            {/* Ingresos */}
            <div className="bg-white p-4 border border-[#bec8ce] rounded-xl shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#006686] bg-[#7dd3fc20] p-2 rounded-lg">
                  payments
                </span>
                <span className="text-[#006b5f] text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>{" "}
                  +8%
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Ingresos Mensuales
                </p>
                <p className="text-[22px] font-semibold text-[#151c27]">
                  $54,200
                </p>
              </div>
            </div>

            {/* Alertas stock */}
            <div className="bg-white p-4 border border-[#bec8ce] rounded-xl shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ffdad620] p-2 rounded-lg">
                  warning
                </span>
                <span className="text-[#ba1a1a] text-xs font-semibold">
                  Crítico
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Alertas de Stock
                </p>
                <p className="text-[22px] font-semibold text-[#151c27]">
                  {cargando ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    `${insumosStockBajo} Artículos`
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Bento layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left col: accesos + tabla citas */}
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
                    <span
                      className={`material-symbols-outlined mb-2 text-3xl transition-transform group-hover:scale-110 ${primary ? "text-[#006686]" : "text-[#006686]"}`}
                    >
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
                {insumosStockBajo === 0 ? (
                  <p className="text-sm text-[#3f484e]">
                    No hay alertas de stock actualmente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#e2e8f8] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#3f484e]">
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
                  </div>
                )}
              </div>

              {/* Actividad reciente */}
              <div className="bg-white border border-[#bec8ce] rounded-xl p-6">
                <h3 className="text-base font-semibold text-[#151c27] mb-4">
                  Actividad Reciente
                </h3>
                <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#bec8ce]">
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#006686] border-2 border-white"></div>
                    <p className="text-[10px] text-[#3f484e] mb-1">
                      hace 10 minutos
                    </p>
                    <p className="text-sm text-[#151c27]">
                      <span className="font-bold">Dra. Laura</span> agregó una
                      nota clínica al expediente.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#bec8ce] border-2 border-white"></div>
                    <p className="text-[10px] text-[#3f484e] mb-1">
                      hace 1 hora
                    </p>
                    <p className="text-sm text-[#151c27]">
                      Nueva cita registrada para{" "}
                      <span className="font-bold text-[#006b5f]">
                        mañana a las 9:00 AM
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="bg-[#006686] rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-12">
                  <span
                    className="material-symbols-outlined text-[120px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    dentistry
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2 relative z-10">
                  Actualización de Software
                </h4>
                <p className="text-sm text-white/80 mb-4 relative z-10">
                  Nuevas herramientas de mapeo dental ya están disponibles.
                </p>
                <button className="bg-white text-[#006686] text-xs font-semibold px-4 py-2 rounded-full relative z-10 hover:shadow-lg transition-all">
                  Explorar Funciones
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
