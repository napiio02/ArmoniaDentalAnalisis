export const ROLES = ["Admin", "Dentista", "Asistente Dental"];
export const ACCESO_DENEGADO = "Acceso denegado. Por favor comuníquese con la administración para solicitar asistencia.";
export const nombreRol = (usuario) => typeof usuario?.rol === "string" ? usuario.rol : usuario?.rol?.nombre;
export const puedeAcceder = (usuario, ruta) => {
  const rol = nombreRol(usuario);
  if (!ROLES.includes(rol)) return false;
  const pathname = ruta.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (/^\/(administracion(?:\/usuarios)?|usuarios)(?:\/|$)/.test(pathname)) return rol === "Admin";
  if (/^\/comprobantes(?:\/|$)/.test(pathname)) return rol !== "Asistente Dental";
  return true;
};
export const ultimaRutaPermitida = (usuario, storage) => {
  try {
    const ultima = JSON.parse(storage.getItem("ultimaRutaPermitida"));
    if (ultima?.usuarioId === String(usuario._id) && ultima.ruta.startsWith("/") &&
      !ultima.ruta.startsWith("//") && !/^\/(login|recuperar-password|restablecer-password)(?:[/?#]|$)/.test(ultima.ruta) &&
      puedeAcceder(usuario, ultima.ruta)) return ultima.ruta;
  } catch { /* Sin una ruta válida guardada, volver al inicio. */ }
  return "/";
};
