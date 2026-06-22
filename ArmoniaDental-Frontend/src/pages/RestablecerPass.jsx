import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { restablecerPassword } from "../services/authService";

function RestablecerPass() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmarPassword: "",
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!token) {
      setError(
        "El enlace de recuperación no es válido. Solicite uno nuevo."
      );
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (formData.password !== formData.confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      await restablecerPassword({
        token,
        password: formData.password,
        confirmarPassword: formData.confirmarPassword,
      });

      setFormData({
        password: "",
        confirmarPassword: "",
      });

      setCompletado(true);
    } catch (error) {
      setError(
        error.message ||
          "No fue posible restablecer la contraseña."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex items-center justify-center px-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#7dd3fc]/10" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#6df5e1]/10" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">ꨄ︎</div>

            <h1 className="text-2xl font-extrabold text-[#151c27]">
              Armonía Dental
            </h1>

            <p className="text-xs text-[#3f484e] mt-1">
              Sistema de gestión clínica
            </p>
          </div>

          {!completado ? (
            <>
              <h2 className="text-lg font-bold text-[#151c27] mb-1">
                Crear nueva contraseña
              </h2>

              <p className="text-xs text-[#3f484e] mb-6">
                Ingresá una nueva contraseña para recuperar el acceso a tu
                cuenta.
              </p>

              {!token && (
                <div className="bg-[#fff3cd] border border-[#f0b429]/30 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-[#725c00] mb-5">
                  <span className="material-symbols-outlined text-[18px]">
                    warning
                  </span>

                  <span>
                    El enlace no contiene un token válido. Solicitá un nuevo
                    correo de recuperación.
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-[#ba1a1a] mb-5">
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>

                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                    Nueva contraseña
                  </label>

                  <div className="relative">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={onChange}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={cargando || !token}
                      className="w-full px-4 pr-11 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarPassword((prev) => !prev)
                      }
                      disabled={cargando || !token}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3f484e] hover:text-[#006686] disabled:opacity-50"
                      aria-label={
                        mostrarPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {mostrarPassword
                          ? "visibility_off"
                          : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                    Confirmar contraseña
                  </label>

                  <div className="relative">
                    <input
                      type={mostrarConfirmacion ? "text" : "password"}
                      name="confirmarPassword"
                      value={formData.confirmarPassword}
                      onChange={onChange}
                      placeholder="Repita la nueva contraseña"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={cargando || !token}
                      className="w-full px-4 pr-11 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarConfirmacion((prev) => !prev)
                      }
                      disabled={cargando || !token}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3f484e] hover:text-[#006686] disabled:opacity-50"
                      aria-label={
                        mostrarConfirmacion
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {mostrarConfirmacion
                          ? "visibility_off"
                          : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#7dd3fc20] border border-[#006686]/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-[#3f484e] flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#006686]">
                      info
                    </span>

                    La contraseña debe tener al menos 8 caracteres.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={cargando || !token}
                  className="w-full py-3 bg-[#006686] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                >
                  {cargando ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        lock_reset
                      </span>
                      Cambiar contraseña
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#6df5e120] border border-[#6df5e1]/30 flex items-center justify-center mx-auto mb-4">
                <span
                  className="material-symbols-outlined text-[#006b5f] text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#151c27] mb-2">
                ¡Contraseña actualizada!
              </h2>

              <p className="text-sm text-[#3f484e] mb-6">
                Tu contraseña fue restablecida correctamente. Ya podés iniciar
                sesión con tus nuevas credenciales.
              </p>

              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#006686] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">
                  login
                </span>
                Ir al inicio de sesión
              </Link>
            </div>
          )}

          {!completado && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#bec8ce]" />
                <span className="text-xs text-[#bec8ce]">o</span>
                <div className="flex-1 h-px bg-[#bec8ce]" />
              </div>

              <Link
                to="/recuperar-password"
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#bec8ce] rounded-full text-xs font-semibold text-[#3f484e] hover:bg-[#f0f3ff] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  refresh
                </span>
                Solicitar un enlace nuevo
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#3f484e] mt-6">
          © 2026 Armonía Dental · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}

export default RestablecerPass;