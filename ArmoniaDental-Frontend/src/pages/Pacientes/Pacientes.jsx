import { useState, useEffect } from "react";
import { Link } from "react-router";
import Sidebar from "../../components/Sidebar";
import { obtenerPacientesConExpediente, toggleActivoPaciente } from "../../services/pacienteService";

const POR_PAGINA = 10;

const getInitials = (nombre = "") =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todo");
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      setCargando(true);
      setError(null);
      const respuesta = await obtenerPacientesConExpediente();
      // El backend responde { ok, message, data: [...] }
      setPacientes(Array.isArray(respuesta?.data) ? respuesta.data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los pacientes.");
      setPacientes([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, estadoFiltro]);

  const filtrados = pacientes.filter((p) => {
    const term = busqueda.toLowerCase();
    const matchBusqueda =
      !busqueda ||
      p.nombre?.toLowerCase().includes(term) ||
      p.correo?.toLowerCase().includes(term) ||
      p.telefono?.includes(busqueda) ||
      p.cedula?.includes(busqueda);
    const matchEstado =
      estadoFiltro === "todo" ||
      (estadoFiltro === "activo" && p.activo) ||
      (estadoFiltro === "inactivo" && !p.activo);
    return matchBusqueda && matchEstado;
  });

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const indicePrimero = (paginaActual - 1) * POR_PAGINA;
  const pacientesActuales = filtrados.slice(
    indicePrimero,
    indicePrimero + POR_PAGINA,
  );

  const handleToggleActivo = async (id, activoActual) => {
  try {
    await toggleActivoPaciente(id);
    setPacientes((prev) =>
      prev.map((p) => p._id === id ? { ...p, activo: !activoActual } : p)
    );
  } catch (err) {
    alert(err.message || "No se pudo cambiar el estado del paciente.");
  }
};

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="pacientes" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                Pacientes
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Gestiona la información de los pacientes de la clínica
              </p>
            </div>
            <Link
              to="/pacientes-nuevo"
              className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo Paciente
            </Link>
          </div>

          {/* Filtros */}
          <div className="bg-white border border-[#bec8ce] rounded-xl p-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo, teléfono o cédula..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                />
              </div>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
              >
                <option value="todo">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white border border-[#bec8ce] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {cargando ? (
                <div className="flex justify-center items-center py-16">
                  <span className="loading loading-spinner loading-lg text-[#006686]" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center gap-3 py-12 text-[#ba1a1a] text-sm">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                  <button
                    onClick={cargarPacientes}
                    className="underline font-semibold ml-2"
                  >
                    Reintentar
                  </button>
                </div>
              ) : filtrados.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                    person_search
                  </span>
                  <p className="text-sm text-[#3f484e]">
                    {pacientes.length === 0
                      ? "No hay pacientes registrados"
                      : "No se encontraron pacientes con los filtros aplicados"}
                  </p>
                </div>
              ) : (
                <>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f0f3ff] border-b border-[#bec8ce]">
                        {[
                          "#",
                          "Paciente",
                          "Cédula",
                          "Teléfono",
                          "Correo",
                          "Estado",
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
                      {pacientesActuales.map((paciente, index) => (
                        <tr
                          key={paciente._id}
                          className={`hover:bg-[#e7eefe]/30 transition-colors ${!paciente.activo ? "opacity-60" : ""}`}
                        >
                          <td className="px-5 py-4 text-sm text-[#3f484e]">
                            {indicePrimero + index + 1}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-xs flex-shrink-0">
                                {getInitials(paciente.nombre)}
                              </div>
                              <span className="text-sm font-semibold text-[#151c27]">
                                {paciente.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#3f484e] font-mono">
                            {paciente.cedula || "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#3f484e]">
                            {paciente.telefono || "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#3f484e]">
                            {paciente.correo || "—"}
                          </td>
                          <td className="px-5 py-4">
                            {paciente.activo ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6df5e120] text-[#006b5f] border border-[#6df5e1]/30">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/pacientes/${paciente._id}`}
                                className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-all"
                                title="Ver"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility
                                </span>
                              </Link>
                              <Link
                                to={`/pacientes/editar/${paciente._id}`}
                                className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-all"
                                title="Editar"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                              </Link>
                              <button
                                onClick={() =>
                                  handleToggleActivo(
                                    paciente._id,
                                    paciente.activo,
                                  )
                                }
                                title={
                                  paciente.activo ? "Desactivar" : "Activar"
                                }
                                className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-all"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {paciente.activo ? "toggle_on" : "toggle_off"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Paginación */}
                  {totalPaginas > 1 && (
                    <div className="px-5 py-3 flex items-center justify-between bg-[#f0f3ff] border-t border-[#bec8ce]">
                      <span className="text-xs font-semibold text-[#3f484e]">
                        Mostrando {indicePrimero + 1} a{" "}
                        {Math.min(indicePrimero + POR_PAGINA, filtrados.length)}{" "}
                        de {filtrados.length} pacientes
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setPaginaActual((p) => Math.max(1, p - 1))
                          }
                          disabled={paginaActual === 1}
                          className="p-1 rounded hover:bg-[#dce2f3] transition-colors disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined">
                            chevron_left
                          </span>
                        </button>
                        {Array.from(
                          { length: Math.min(totalPaginas, 5) },
                          (_, i) => i + 1,
                        ).map((n) => (
                          <button
                            key={n}
                            onClick={() => setPaginaActual(n)}
                            className={`w-8 h-8 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                              paginaActual === n
                                ? "bg-[#006686] text-white"
                                : "hover:bg-[#dce2f3] text-[#3f484e]"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setPaginaActual((p) =>
                              Math.min(totalPaginas, p + 1),
                            )
                          }
                          disabled={paginaActual >= totalPaginas}
                          className="p-1 rounded hover:bg-[#dce2f3] transition-colors disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined">
                            chevron_right
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pacientes;
