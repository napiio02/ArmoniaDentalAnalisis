import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { USUARIOS } from "../data/mockData";

const ROLES = ["Dentista", "Asistente Dental", "Recepcionista", "Admin"];

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

const getInitials = (nombre = "") =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState(USUARIOS);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todo");
  const [rolFiltro, setRolFiltro] = useState("todo");
  const [statusLoading, setStatusLoading] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    email: "",
    cedula: "",
    telefono: "",
    rol: "Recepcionista",
  });

  const filtrados = usuarios.filter((u) => {
    const term = busqueda.toLowerCase();
    const matchBusqueda =
      !busqueda ||
      u.nombre.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.cedula?.includes(busqueda);
    const matchEstado =
      estadoFiltro === "todo" ||
      (estadoFiltro === "activo" ? u.activo : !u.activo);
    const matchRol = rolFiltro === "todo" || u.rol === rolFiltro;
    return matchBusqueda && matchEstado && matchRol;
  });

  const toggleEstado = (id) => {
    setStatusLoading(id);
    setTimeout(() => {
      setUsuarios((prev) =>
        prev.map((u) => (u._id === id ? { ...u, activo: !u.activo } : u)),
      );
      setStatusLoading(null);
    }, 500);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    setGuardando(true);
    setTimeout(() => {
      setUsuarios((prev) => [
        ...prev,
        { _id: `u${Date.now()}`, ...formNuevo, activo: true },
      ]);
      setFormNuevo({
        nombre: "",
        email: "",
        cedula: "",
        telefono: "",
        rol: "Recepcionista",
      });
      setMostrarModal(false);
      setGuardando(false);
    }, 600);
  };

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="usuarios" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                Usuarios
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Gestión del personal de Armonía Dental
              </p>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                person_add
              </span>
              Registrar Usuario
            </button>
          </div>

          {/* Filtros */}
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
                {ROLES.map((r) => (
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

          {/* Tabla */}
          <div className="bg-white border border-[#bec8ce] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {filtrados.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                    group
                  </span>
                  <p className="text-sm text-[#3f484e]">
                    No se encontraron usuarios
                  </p>
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
                    {filtrados.map((usuario, index) => (
                      <tr
                        key={usuario._id}
                        className={`hover:bg-[#e7eefe]/30 transition-colors ${!usuario.activo ? "opacity-60" : ""}`}
                      >
                        <td className="px-5 py-4 text-sm text-[#3f484e]">
                          {index + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-xs flex-shrink-0">
                              {getInitials(usuario.nombre)}
                            </div>
                            <span className="text-sm font-semibold text-[#151c27]">
                              {usuario.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#3f484e] font-mono">
                          {usuario.cedula}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#3f484e]">
                          {usuario.email}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#3f484e]">
                          {usuario.telefono}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${BADGE_ROL[usuario.rol] || "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]"}`}
                          >
                            {usuario.rol}
                          </span>
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
                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleEstado(usuario._id)}
                            disabled={statusLoading === usuario._id}
                            className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-all disabled:opacity-40"
                            title={usuario.activo ? "Desactivar" : "Activar"}
                          >
                            {statusLoading === usuario._id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">
                                {usuario.activo ? "toggle_on" : "toggle_off"}
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal nuevo usuario */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#151c27]">
                Registrar Usuario
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={handleGuardar}
              autoComplete="off"
            >
              <div>
                <Label>Nombre completo *</Label>
                <input
                  type="text"
                  value={formNuevo.nombre}
                  onChange={(e) =>
                    setFormNuevo((p) => ({ ...p, nombre: e.target.value }))
                  }
                  required
                  className={inputCls}
                  placeholder="Ej: Laura Ureña"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cédula *</Label>
                  <input
                    type="text"
                    value={formNuevo.cedula}
                    onChange={(e) =>
                      setFormNuevo((p) => ({ ...p, cedula: e.target.value }))
                    }
                    required
                    className={inputCls}
                    placeholder="112345678"
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <input
                    type="tel"
                    value={formNuevo.telefono}
                    onChange={(e) =>
                      setFormNuevo((p) => ({ ...p, telefono: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="88001122"
                  />
                </div>
              </div>

              <div>
                <Label>Correo *</Label>
                <input
                  type="email"
                  value={formNuevo.email}
                  onChange={(e) =>
                    setFormNuevo((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                  className={inputCls}
                  placeholder="correo@armoniadental.com"
                />
              </div>

              <div>
                <Label>Rol *</Label>
                <select
                  value={formNuevo.rol}
                  onChange={(e) =>
                    setFormNuevo((p) => ({ ...p, rol: e.target.value }))
                  }
                  className={inputCls}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                      Registrar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
