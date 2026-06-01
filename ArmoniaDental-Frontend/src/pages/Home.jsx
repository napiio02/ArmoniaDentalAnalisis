import { useEffect, useState } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { Users, Calendar, DollarSign, Package, Clock, FileText } from "lucide-react";
import { getCitas } from "../services/citaService";

const DURACIONES = {
  Limpieza: 45,
  Revisión: 30,
  Cirugía: 120,
  Blanqueamiento: 60,
  Ortodoncia: 30,
  Empaste: 60,
  Radiografía: 20,
};

const Home = () => {
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasMes, setCitasMes] = useState(0);
  const [insumosStockBajo, setInsumosStockBajo] = useState(0);
  const [cargando, setCargando] = useState(true);

  const hoy = new Date();
  const fechaHoyISO = hoy.toISOString().split("T")[0];
  const nombreMes = hoy.toLocaleString("es-CR", { month: "long", year: "numeric" });

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
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
        const delMes = todasLasCitas.filter((c) => {
          const f = new Date(c.fecha_hora);
          return f >= primerDiaMes && f <= ultimoDiaMes;
        });
        setCitasMes(delMes.length);

        const resInsumos = await fetch("http://localhost:3000/v1/insumos", { headers });
        if (resInsumos.ok) {
          const insumos = await resInsumos.json();
          const lista = Array.isArray(insumos) ? insumos : insumos.data ?? [];
          const stockBajo = lista.filter(
            (i) => i.activo && i.stock_actual <= i.stock_minimo
          ).length;
          setInsumosStockBajo(stockBajo);
        }
      } catch (error) {
        console.error("Error al cargar datos del home:", error);
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

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="mb-8 px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Estadísticas</h2>
          <p className="text-gray-600 mb-4">Resumen general del desempeño de la clínica</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-7">
            {/* Citas hoy */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Citas de Hoy</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {cargando ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      citasHoy.filter((c) => c.estado !== "Cancelada").length
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{fechaHoyISO}</p>
                </div>
                <div className="p-2 bg-primary/15 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Citas del mes */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Citas del Mes</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {cargando ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      citasMes
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{nombreMes}</p>
                </div>
                <div className="p-2 bg-primary/15 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Insumos stock bajo */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Insumos Stock Bajo</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {cargando ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      insumosStockBajo
                    )}
                  </h3>
                  <p className="text-xs text-red-500 mt-1">Requieren reabastecimiento</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <Package className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Citas de hoy */}
        <div className="px-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Citas de Hoy</h2>
          <p className="text-gray-600 mb-4 capitalize">
            Agenda del día —{" "}
            {hoy.toLocaleDateString("es-CR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {cargando ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : citasHoy.filter((c) => c.estado !== "Cancelada").length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              No hay citas programadas para hoy.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {citasHoy
                .filter((c) => c.estado !== "Cancelada")
                .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
                .map((cita) => (
                  <div
                    key={cita._id}
                    className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">
                        {formatearHora(cita.fecha_hora)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {DURACIONES[cita.tipo] ?? 30} min
                        </span>
                        <span
                          className={`badge ${
                            cita.estado === "Confirmada"
                              ? "bg-sky-400 border-sky-400 text-white"
                              : cita.estado === "Programada"
                              ? "badge-warning"
                              : cita.estado === "En atención"
                              ? "badge-info"
                              : "badge-neutral"
                          }`}
                        >
                          {cita.estado}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {cita.paciente_id?.nombre ?? "Paciente"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cita.tipo} · {cita.motivo}
                    </p>
                    {cita.usuario_id?.nombre && (
                      <p className="text-xs text-gray-400 mt-1">
                        Doctor(a): {cita.usuario_id.nombre}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Módulos */}
        <div className="px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Módulos</h2>
          <p className="text-gray-600 mb-4">Acceso rápido a todas las funciones del sistema</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-7">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
              <div className="flex items-start mb-4">
                <div className="p-2 bg-primary/15 rounded-lg mr-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Gestión de Pacientes</h3>
                  <p className="text-sm text-gray-600">
                    Administra la información y expedientes de los pacientes de la clínica
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <Link to="/pacientes" className="btn btn-secondary flex-1">Ver Pacientes</Link>
                <Link to="/pacientes-nuevo" className="btn btn-outline btn-secondary flex-1">Nuevo Paciente</Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
              <div className="flex items-start mb-4">
                <div className="p-2 bg-primary/15 rounded-lg mr-3">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Agenda de Citas</h3>
                  <p className="text-sm text-gray-600">
                    Programa y controla las citas: limpiezas, cirugías, revisiones y más
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <Link to="/citas" className="btn btn-secondary flex-1">Ver Citas</Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
              <div className="flex items-start mb-4">
                <div className="p-2 bg-primary/15 rounded-lg mr-3">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Inventario</h3>
                  <p className="text-sm text-gray-600">
                    Controla los insumos médicos y recibe alertas cuando el stock es bajo
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <Link to="/inventario" className="btn btn-secondary flex-1">Ver Inventario</Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
              <div className="flex items-start mb-4">
                <div className="p-2 bg-primary/15 rounded-lg mr-3">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Control de Marcas</h3>
                  <p className="text-sm text-gray-600">
                    Registra entradas y salidas del personal y calcula horas trabajadas
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <Link to="/control-marcas" className="btn btn-secondary flex-1">Ver Marcas</Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
              <div className="flex items-start mb-4">
                <div className="p-2 bg-primary/15 rounded-lg mr-3">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Comprobantes</h3>
                  <p className="text-sm text-gray-600">
                    Genera constancias de atención, incapacidades y justificaciones laborales
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <Link to="/comprobantes" className="btn btn-secondary flex-1">Ver Comprobantes</Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
              <div className="flex items-start mb-4">
                <div className="p-2 bg-primary/15 rounded-lg mr-3">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Reportes</h3>
                  <p className="text-sm text-gray-600">
                    Visualiza estadísticas de atención, ingresos, cancelaciones y más
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <Link to="/reportes" className="btn btn-secondary flex-1">Ver Reportes</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
