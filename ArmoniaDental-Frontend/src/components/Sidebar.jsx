import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { cerrarSesion } from "../services/authService";

export default function Sidebar({ activeItem = "citas" }) {
  const navigate = useNavigate();

  const [openExpedientes, setOpenExpedientes] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorSesion, setErrorSesion] = useState("");

  const obtenerUsuarioGuardado = () => {
    try {
      const usuarioGuardado = localStorage.getItem("usuario");

      return usuarioGuardado
        ? JSON.parse(usuarioGuardado)
        : null;
    } catch (error) {
      console.error(
        "No fue posible leer el usuario guardado:",
        error
      );

      return null;
    }
  };

  const usuario = obtenerUsuarioGuardado();

  const nombreUsuario =
    usuario?.nombre || "Usuario de Armonía Dental";

  const nombreRol =
    typeof usuario?.rol === "string"
      ? usuario.rol
      : usuario?.rol?.nombre || "Usuario";

  const obtenerIniciales = (nombre) => {
    const palabras = nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (palabras.length === 0) {
      return "AD";
    }

    return palabras
      .slice(0, 2)
      .map((palabra) => palabra.charAt(0).toUpperCase())
      .join("");
  };

  const handleCerrarSesion = async () => {
    setErrorSesion("");
    setCerrandoSesion(true);

    try {
      await cerrarSesion();

      localStorage.removeItem("usuario");

      // Se elimina también por si quedó guardado
      // el token antiguo de demostración.
      localStorage.removeItem("token");

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error cerrando la sesión:", error);

      setErrorSesion(
        error.message ||
          "No fue posible cerrar la sesión."
      );
    } finally {
      setCerrandoSesion(false);
    }
  };

  const navItem = (icon, label, to, active) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-semibold ${
        active
          ? "bg-[#7dd3fc20] text-[#006686] border-l-4 border-[#006686]"
          : "text-[#3f484e] hover:bg-[#f0f3ff]"
      }`}
    >
      <span className="material-symbols-outlined text-[22px]">
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );

  return (
    <aside className="w-[260px] h-screen bg-white border-r border-[#bec8ce] flex flex-col flex-shrink-0 z-50">
      {/* Logo */}
      <Link
        to="/"
        className="p-6 flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
      >
        <span className="text-2xl">ꨄ︎</span>

        <span className="font-bold text-lg text-[#151c27]">
          Armonía Dental
        </span>
      </Link>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {/* Expedientes */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() =>
              setOpenExpedientes(!openExpedientes)
            }
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e] text-sm font-semibold"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px]">
                folder_shared
              </span>

              <span>Expedientes</span>
            </div>

            <span
              className="material-symbols-outlined text-[18px] transition-transform"
              style={{
                transform: openExpedientes
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              }}
            >
              expand_more
            </span>
          </button>

          {openExpedientes && (
            <div className="pl-10 space-y-1 mt-1">
              <Link
                to="/pacientes"
                className="block py-2 text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
              >
                Pacientes
              </Link>

              <Link
                to="/expedientes"
                className="block py-2 text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
              >
                Historial Clínico
              </Link>

              <Link
                to="/odontograma"
                className="block py-2 text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
              >
                Odontograma
              </Link>
            </div>
          )}
        </div>

        {navItem(
          "calendar_today",
          "Citas",
          "/citas",
          activeItem === "citas"
        )}

        {navItem(
          "inventory_2",
          "Inventario",
          "/inventario",
          activeItem === "inventario"
        )}

        {/* Administración */}
        <div className="space-y-1 pt-2">
          <button
            type="button"
            onClick={() => setOpenAdmin(!openAdmin)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e] text-sm font-semibold"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px]">
                admin_panel_settings
              </span>

              <span>Administración</span>
            </div>

            <span
              className="material-symbols-outlined text-[18px] transition-transform"
              style={{
                transform: openAdmin
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              }}
            >
              expand_more
            </span>
          </button>

          {openAdmin && (
            <div className="pl-10 space-y-1 mt-1">
              <Link
                to="/control-marcas"
                className="block py-2 text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
              >
                Control de Marcas
              </Link>

              <Link
                to="/comprobantes"
                className="block py-2 text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
              >
                Comprobantes
              </Link>

              <Link
                to="/reportes"
                className="block py-2 text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
              >
                Reportes
              </Link>
            </div>
          )}
        </div>

        {navItem(
          "group",
          "Usuarios",
          "/usuarios",
          activeItem === "usuarios"
        )}
      </nav>

      {/* Usuario y cierre de sesión */}
      <div className="p-4 border-t border-[#bec8ce]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-[#006686] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {obtenerIniciales(nombreUsuario)}
          </div>

          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-[#151c27] truncate">
              {nombreUsuario}
            </p>

            <p className="text-[10px] text-[#3f484e] uppercase tracking-wider truncate">
              {nombreRol}
            </p>
          </div>
        </div>

        {errorSesion && (
          <p className="text-xs text-[#ba1a1a] mb-3 px-2">
            {errorSesion}
          </p>
        )}

        <button
          type="button"
          onClick={handleCerrarSesion}
          disabled={cerrandoSesion}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#e2e8f8] transition-colors text-xs font-semibold text-[#3f484e] disabled:opacity-60"
        >
          {cerrandoSesion ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              Cerrando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
              Cerrar Sesión
            </>
          )}
        </button>
      </div>
    </aside>
  );
}