import { useAuth } from "../auth/AuthContext";
import { puedeAcceder } from "../auth/permisos";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";

import { cerrarSesion } from "../services/authService";

const opcionesAdministracion = [
  { icono: "group", nombre: "Usuarios", ruta: "/administracion/usuarios" },
  { icono: "schedule", nombre: "Control de Marcas", ruta: "/control-marcas" },
  { icono: "description", nombre: "Comprobantes", ruta: "/comprobantes" },
  { icono: "bar_chart", nombre: "Reportes", ruta: "/reportes" },
];

const opcionesExpedientes = [
  { nombre: "Pacientes", ruta: "/pacientes" },
  { nombre: "Historial Clínico", ruta: "/expedientes" },
  { nombre: "Odontograma", ruta: "/odontograma" },
];

export default function Sidebar({ activeItem = "citas" }) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const esRutaAdministracion = opcionesAdministracion.some(
    (opcion) => opcion.ruta === pathname
  );

  const [openExpedientes, setOpenExpedientes] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(esRutaAdministracion);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false); // menú en teléfono/tableta
  const [errorSesion, setErrorSesion] = useState("");

  useEffect(() => {
    if (esRutaAdministracion) {
      setOpenAdmin(true);
    }
  }, [pathname, esRutaAdministracion]);

  // En teléfono el menú se cierra al navegar
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // Con el menú abierto: Escape lo cierra y el fondo no se desplaza
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const alPresionar = (e) => e.key === "Escape" && setMenuAbierto(false);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", alPresionar);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", alPresionar);
    };
  }, [menuAbierto]);

  const { usuario, salir } = useAuth();

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

      salir();
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

  const contenido = (
    <>
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
              {opcionesExpedientes
                .filter((opcion) => puedeAcceder(usuario, opcion.ruta))
                .map((opcion) => (
                  <Link
                    key={opcion.ruta}
                    to={opcion.ruta}
                    className="block py-2 text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
                  >
                    {opcion.nombre}
                  </Link>
                ))}
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
              {opcionesAdministracion.filter((opcion) => puedeAcceder(usuario, opcion.ruta)).map((opcion) => (
                <div key={opcion.ruta}>
                  {navItem(
                    opcion.icono,
                    opcion.nombre,
                    opcion.ruta,
                    pathname === opcion.ruta
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
    </>
  );

  return (
    <>
      {/* Barra superior: solo en teléfono y tableta */}
      <header
        className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-b border-[#bec8ce]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="h-14 flex items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            className="p-2 rounded-lg text-[#151c27] hover:bg-[#f0f3ff] transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <span className="text-xl">ꨄ︎</span>
            <span className="font-bold text-[#151c27] truncate">Armonía Dental</span>
          </Link>
          <div
            className="ml-auto w-8 h-8 rounded-full bg-[#006686] flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
            title={`${nombreUsuario} · ${nombreRol}`}
          >
            {obtenerIniciales(nombreUsuario)}
          </div>
        </div>
      </header>

      {/* Escritorio: menú fijo a la izquierda */}
      <aside className="hidden lg:flex w-[260px] h-dvh bg-white border-r border-[#bec8ce] flex-col flex-shrink-0 z-50">
        {contenido}
      </aside>

      {/* Teléfono y tableta: menú deslizable */}
      {menuAbierto && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuAbierto(false)} aria-hidden="true" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white flex flex-col shadow-2xl"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <button
              type="button"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú"
              className="absolute top-3 right-3 p-2 rounded-lg text-[#3f484e] hover:bg-[#f0f3ff] transition-colors"
              style={{ marginTop: "env(safe-area-inset-top)" }}
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            {contenido}
          </aside>
        </div>
      )}
    </>
  );
}