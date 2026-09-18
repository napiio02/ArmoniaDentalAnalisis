export const autorizarRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({ ok: false, code: "FORBIDDEN",
      message: "Acceso denegado. Por favor comuníquese con la administración para solicitar asistencia.", data: null });
  }
  next();
};
