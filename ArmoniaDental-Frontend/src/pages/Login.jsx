import { Link, useNavigate } from "react-router";
import { useState } from "react";

import { iniciarSesion } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

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
    setCargando(true);

    try {
      const resultado = await iniciarSesion({
        email: formData.email.trim(),
        password: formData.password,
      });

      /*
       * Guardamos únicamente información visual del usuario.
       * El JWT permanece protegido en la cookie HttpOnly.
       */
      localStorage.setItem(
        "usuario",
        JSON.stringify(resultado.data.usuario)
      );

      navigate("/", { replace: true });
    } catch (error) {
      setError(
        error.message ||
          "No fue posible iniciar sesión. Verifique sus credenciales."
      );
    } finally {
      setCargando(false);
    }
  };

  const colocarCredencialesPrueba = () => {
    setFormData({
      email: "laura@armoniadental.com",
      password: "Laura1234!",
    });

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
        {/* Card */}
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

          <h2 className="text-lg font-bold text-[#151c27] mb-1">
            Iniciar Sesión
          </h2>

          <p className="text-xs text-[#3f484e] mb-6">
            Ingrese su correo y contraseña para acceder al sistema
          </p>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#ba1a1a] mb-5">
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>

              <span>{error}</span>
            </div>
          )}

          {/* Credenciales de prueba */}
          <div className="bg-[#7dd3fc20] border border-[#006686]/20 rounded-xl p-3 mb-5">
            <p className="text-xs font-bold text-[#006686] mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                info
              </span>
              Credenciales de prueba
            </p>

            <p className="text-xs text-[#3f484e] font-mono">
              laura@armoniadental.com
            </p>

            <p className="text-xs text-[#3f484e] font-mono">
              Laura1234!
            </p>

            <button
              type="button"
              onClick={colocarCredencialesPrueba}
              className="mt-2 text-xs font-semibold text-[#006686] hover:underline"
            >
              Usar credenciales de prueba
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                placeholder="correo@armoniadental.com"
                autoComplete="email"
                required
                disabled={cargando}
                className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] disabled:opacity-60"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">
                  Contraseña
                </label>

                <Link
                  to="/recuperar-password"
                  className="text-xs text-[#006686] hover:underline italic"
                >
                  ¿Olvidaste la contraseña?
                </Link>
              </div>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={onChange}
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
                required
                disabled={cargando}
                className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-[#006686] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {cargando ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Ingresando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    login
                  </span>
                  Ingresar
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#3f484e] mt-6">
          © 2026 Armonía Dental · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}

export default Login;