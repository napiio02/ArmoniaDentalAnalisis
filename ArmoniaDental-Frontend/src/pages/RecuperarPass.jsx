import { useState } from "react";
import { Link } from "react-router";

import { solicitarRecuperacionPassword } from "../services/authService";

function RecuperarPass() {
  const [email, setEmail] = useState("");
  const [emailEnviado, setEmailEnviado] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setCargando(true);

    try {
      const emailNormalizado = email.trim().toLowerCase();

      await solicitarRecuperacionPassword(emailNormalizado);

      setEmailEnviado(emailNormalizado);
      setEnviado(true);
    } catch (error) {
      setError(
        error.message ||
          "No fue posible procesar la solicitud de recuperación."
      );
    } finally {
      setCargando(false);
    }
  };

  const volverAIntentar = () => {
    setEnviado(false);
    setEmailEnviado("");
    setEmail("");
    setError("");
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

          {!enviado ? (
            <>
              <h2 className="text-lg font-bold text-[#151c27] mb-1">
                Recuperar contraseña
              </h2>

              <p className="text-xs text-[#3f484e] mb-6">
                Ingresá tu correo y te enviaremos un enlace para restablecer tu
                contraseña.
              </p>

              {error && (
                <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#ba1a1a] mb-5">
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>

                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e] text-[18px]">
                      mail
                    </span>

                    <input
                      type="email"
                      placeholder="correo@armoniadental.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);

                        if (error) {
                          setError("");
                        }
                      }}
                      autoComplete="email"
                      required
                      disabled={cargando}
                      className="w-full pl-10 pr-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-3 bg-[#006686] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                >
                  {cargando ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        send
                      </span>
                      Enviar enlace de recuperación
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
                ¡Solicitud procesada!
              </h2>

              <p className="text-sm text-[#3f484e] mb-2">
                Si el correo{" "}
                <span className="font-semibold text-[#151c27]">
                  {emailEnviado}
                </span>{" "}
                está registrado, recibirás un enlace para restablecer tu
                contraseña.
              </p>

              <p className="text-xs text-[#bec8ce] mb-5">
                Revisá también tu carpeta de spam o correo no deseado.
              </p>

              <button
                type="button"
                onClick={volverAIntentar}
                className="text-xs font-semibold text-[#006686] hover:underline"
              >
                Enviar a otro correo
              </button>
            </div>
          )}

          {/* Divisor */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#bec8ce]" />
            <span className="text-xs text-[#bec8ce]">o</span>
            <div className="flex-1 h-px bg-[#bec8ce]" />
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#bec8ce] rounded-full text-xs font-semibold text-[#3f484e] hover:bg-[#f0f3ff] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Volver al inicio de sesión
          </Link>
        </div>

        <p className="text-center text-xs text-[#3f484e] mt-6">
          © 2026 Armonía Dental · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}

export default RecuperarPass;