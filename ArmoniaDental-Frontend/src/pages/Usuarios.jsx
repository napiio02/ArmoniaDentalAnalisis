import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { listarUsuarios } from "../services/usuarioService";

const BADGE_ROL = {
  Dentista: "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20",
  "Asistente Dental": "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/30",
  Recepcionista: "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]",
  Admin: "bg-[#ffddb820] text-[#855300] border-[#855300]/20",
};

const inputCls =
  "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]";
const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

// El backend puebla rol_id como objeto ({ _id, nombre, descripcion, activo }),
// no hay campo "rol" plano. Este helper centraliza la lectura.
const nombreRolDe = (usuario) => usuario?.rol_id?.nombre || "Sin rol";

const getInitials = (nombre = "") => {
  const limpio = nombre.trim();
  if (!limpio) return "?";
  return limpio
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todo");
  const [rolFiltro, setRolFiltro] = useState("todo");
  const [mostrarModal, setMostrarModal] = useState(false);

  const mostrarError = (mensaje) => {
    setError(mensaje);
    setTimeout(() => setError(""), 3500);
  };

  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        const resultado = await listarUsuarios();
        const lista = Array.isArray(resultado) ? resultado : resultado?.data || [];
        setUsuarios(lista);

        // Roles únicos derivados de los usuarios reales, para el filtro.
        const rolesUnicos = [
          ...new Set(lista.map((u) => nombreRolDe(u)).filter((r) => r !== "Sin rol")),
        ];
        setRoles(rolesUnicos);
      } catch (err) {
        mostrarError(err.message || "No se pudieron cargar los usuarios.");
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const filtrados = usuarios.filter((u) => {
    const term = busqueda.toLowerCase();
    const matchBusqueda =
      !busqueda ||
      (u.nombre || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.cedula || "").includes(busqueda);

    const matchEstado =
      estadoFiltro === "todo" || (estadoFiltro === "activo" ? u.activo : !u.activo);

    const matchRol = rolFiltro === "todo" || nombreRolDe(u) === rolFiltro;

    return matchBusqueda && matchEstado && matchRol;
  });

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="usuarios" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">Usuarios</h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Gestión del personal de Armonía Dental
              </p>
            </div>

            <button
              onClick={() => setMostrarModal(true)}
              disabled
              title="Falta el endpoint POST para crear usuarios en el backend"
              className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold opacity-40 cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Registrar Usuario
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] px-5 py-3 text-sm text-[#ba1a1a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div className="bg-white border border-[#bec8ce] rounded-xl p-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o cédula..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                />
              </div>

              <select
                value={rolFiltro}
                onChange={(e) => setRolFiltro(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
              >
                <option value="todo">Todos los roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

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

          <div className="bg-white border border-[#bec8ce] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {cargando ? (
                <div className="text-center py-16">
                  <p className="text-sm text-[#3f484e]">Cargando usuarios…</p>
                </div>
              ) : filtrados.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                    group
                  </span>
                  <p className="text-sm text-[#3f484e]">No se encontraron usuarios</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f0f3ff] border-b border-[#bec8ce]">
                      {[
                        "#",
                        "Nombre",
                        "Cédula",
                        "Correo",
                        "Teléfono",
                        "Rol",
                        "Estado cuenta",
                        "Activo",
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
                    {filtrados.map((usuario, index) => {
                      const incompleto = !usuario.nombre || !usuario.email;

                      return (
                        <tr
                          key={usuario._id}
                          className={`hover:bg-[#e7eefe]/30 transition-colors ${
                            !usuario.activo ? "opacity-60" : ""
                          }`}
                        >
                          <td className="px-5 py-4 text-sm text-[#3f484e]">{index + 1}</td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-xs flex-shrink-0">
                                {getInitials(usuario.nombre)}
                              </div>
                              <span className="text-sm font-semibold text-[#151c27]">
                                {usuario.nombre || (
                                  <span className="italic text-[#9ca3af]">Sin nombre</span>
                                )}
                              </span>
                              {incompleto && (
                                <span
                                  title="Registro incompleto"
                                  className="material-symbols-outlined text-[16px] text-[#855300]"
                                >
                                  warning
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-[#3f484e] font-mono">
                            {usuario.cedula || "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#3f484e]">
                            {usuario.email || "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#3f484e]">
                            {usuario.telefono || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                                BADGE_ROL[nombreRolDe(usuario)] ||
                                "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]"
                              }`}
                            >
                              {nombreRolDe(usuario)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-[#3f484e]">
                            {usuario.estado_cuenta || "—"}
                          </td>

                          <td className="px-5 py-4">
                            {usuario.activo ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6df5e120] text-[#006b5f] border border-[#6df5e1]/30">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20">
                                Inactivo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Usuarios;