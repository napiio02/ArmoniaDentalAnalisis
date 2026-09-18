import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { obtenerSesion } from "../services/authService";
import { cambiarSesionLocal, epochSesion } from "../services/apiClient";
import { ACCESO_DENEGADO } from "./permisos";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();
  const usuarioRef = useRef(null);
  const invalidarSesion = useCallback((avisar = true) => {
    cambiarSesionLocal();
    usuarioRef.current = null;
    setUsuario(null);
    setBloqueado(false);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    sessionStorage.removeItem("ultimaRutaPermitida");
    if (avisar) setMensaje("Su sesión dejó de ser válida. Por favor inicie sesión nuevamente.");
    navigate("/login", { replace: true });
  }, [navigate]);
  const validarSesion = useCallback(async () => {
    const actualEpoch = epochSesion();
    const resultado = await obtenerSesion();
    if (actualEpoch !== epochSesion()) throw Object.assign(new Error("La sesión cambió."), { code: "SESSION_CHANGED" });
    const actual = resultado.data.usuario;
    usuarioRef.current = actual;
    setUsuario(actual);
    setBloqueado(false);
    // Información visual; los permisos siempre vienen de /auth/me.
    localStorage.setItem("usuario", JSON.stringify(actual));
    localStorage.removeItem("token");
    return actual;
  }, []);
  const iniciarSesionLocal = useCallback(() => {
    cambiarSesionLocal();
    sessionStorage.removeItem("ultimaRutaPermitida");
    setMensaje("");
  }, []);
  useEffect(() => {
    const escuchar = (event) => {
      if (event.detail.code === "SESSION_INVALID") invalidarSesion(Boolean(usuarioRef.current));
      if (event.detail.code === "FORBIDDEN") setMensaje(ACCESO_DENEGADO);
      if (event.detail.code === "AUTH_UNAVAILABLE") setBloqueado(true);
    };
    const sincronizar = (event) => {
      if (event.key === "auth:logout") invalidarSesion(false);
    };
    window.addEventListener("auth:respuesta", escuchar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener("auth:respuesta", escuchar);
      window.removeEventListener("storage", sincronizar);
    };
  }, [invalidarSesion]);
  const haySesion = Boolean(usuario);
  useEffect(() => {
    if (!haySesion) return;
    let comprobando = false;
    const comprobar = async () => {
      if (comprobando || document.visibilityState === "hidden") return;
      comprobando = true;
      try { await validarSesion(); }
      catch (error) { if (!["SESSION_INVALID", "SESSION_CHANGED"].includes(error.code)) setBloqueado(true); }
      finally { comprobando = false; }
    };
    const timer = setInterval(comprobar, 10000);
    window.addEventListener("focus", comprobar);
    document.addEventListener("visibilitychange", comprobar);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", comprobar);
      document.removeEventListener("visibilitychange", comprobar);
    };
  }, [haySesion, validarSesion]);
  const salir = useCallback(() => {
    localStorage.setItem("auth:logout", String(Date.now()));
    invalidarSesion(false);
  }, [invalidarSesion]);
  const accesoDenegado = useCallback(() => setMensaje(ACCESO_DENEGADO), []);
  const valor = useMemo(() => ({ usuario, bloqueado, validarSesion, iniciarSesionLocal, salir,
    accesoDenegado }), [usuario, bloqueado, validarSesion, iniciarSesionLocal, salir, accesoDenegado]);
  return <AuthContext.Provider value={valor}>
    {children}
    {mensaje && <div className="font-[Nunito_Sans,sans-serif] fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="aviso-seguridad" className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[#bec8ce]">
        <h2 id="aviso-seguridad" className="text-lg font-bold text-[#151c27] mb-3">Aviso de acceso</h2>
        <p className="text-sm text-[#3f484e]">{mensaje}</p>
        <div className="flex justify-end mt-6"><button autoFocus type="button" onClick={() => setMensaje("")} className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90">Entendido</button></div>
      </div>
    </div>}
  </AuthContext.Provider>;
}
