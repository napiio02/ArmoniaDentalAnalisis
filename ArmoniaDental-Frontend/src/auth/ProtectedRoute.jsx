import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import { puedeAcceder, ultimaRutaPermitida } from "./permisos";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { usuario, bloqueado, validarSesion, accesoDenegado } = useAuth();
  const [validacion, setValidacion] = useState(null);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const actual = await validarSesion();
        if (!vigente) return;
        if (!puedeAcceder(actual, location.pathname)) {
          accesoDenegado();
          setValidacion({ key: location.key, destino: ultimaRutaPermitida(actual, sessionStorage) });
        } else {
          sessionStorage.setItem("ultimaRutaPermitida", JSON.stringify({ usuarioId: String(actual._id),
            ruta: location.pathname + location.search + location.hash }));
          setValidacion({ key: location.key, permitido: true });
        }
      } catch (error) {
        if (vigente) setValidacion({ key: location.key, error: error.code === "SESSION_INVALID" ? "login" : "validacion" });
      }
    })();
    return () => { vigente = false; };
  // Cada navegación exige una comprobación nueva; el mensaje no altera esa comprobación.
  }, [location.key, location.pathname, location.search, location.hash, intento, validarSesion, accesoDenegado]);
  useEffect(() => {
    if (validacion?.key === location.key && validacion.permitido && usuario && !puedeAcceder(usuario, location.pathname)) {
      accesoDenegado();
      setValidacion({ key: location.key, destino: ultimaRutaPermitida(usuario, sessionStorage) });
    }
  }, [usuario, validacion, location.key, location.pathname, accesoDenegado]);
  if (validacion?.key === location.key && validacion.destino) return <Navigate to={validacion.destino} replace />;
  if (validacion?.key === location.key && validacion.error === "login") return <Navigate to="/login" replace />;
  if (validacion?.key !== location.key || !validacion.permitido || bloqueado || !usuario) {
    const error = bloqueado || (validacion?.key === location.key && validacion.error === "validacion");
    return <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
      <div className="text-center"><span className="loading loading-spinner loading-lg text-[#006686]" />
        <p className="text-sm text-[#3f484e] mt-3">{error ? "No fue posible validar la sesión. El acceso está temporalmente detenido." : "Verificando sesión..."}</p>
        {error && <button type="button" onClick={() => setIntento((n) => n + 1)} className="mt-4 px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold">Reintentar</button>}
      </div>
    </div>;
  }
  if (!puedeAcceder(usuario, location.pathname)) return null;
  return children;
}
