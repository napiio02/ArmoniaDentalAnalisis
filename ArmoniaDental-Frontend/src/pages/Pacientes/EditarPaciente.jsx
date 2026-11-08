import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { obtenerPacientePorId, actualizarPaciente } from "../../services/pacienteService";

const inputCls = (error) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none bg-white text-[#151c27] transition-colors ${
    error ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : "border-[#bec8ce] focus:border-[#006686]"
  }`;

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const aFechaInput = (isoString) => {
  if (!isoString) return "";
  return isoString.split("T")[0];
};

// ── Formateo automático CR ──
const formatearCedula = (valor) => {
  const limpio = valor.replace(/\D/g, "").slice(0, 9);
  if (limpio.length <= 1) return limpio;
  if (limpio.length <= 5) return `${limpio.slice(0, 1)}-${limpio.slice(1)}`;
  return `${limpio.slice(0, 1)}-${limpio.slice(1, 5)}-${limpio.slice(5, 9)}`;
};

const formatearTelefono = (valor) => {
  const limpio = valor.replace(/\D/g, "").slice(0, 8);
  if (limpio.length <= 4) return limpio;
  return `${limpio.slice(0, 4)}-${limpio.slice(4, 8)}`;
};

const FORM_VACIO = {
  nombre: "", cedula: "", telefono: "", correo: "",
  fecha_nacimiento: "",
};

const EditarPaciente = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(FORM_VACIO);
  const [activo, setActivo] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [exito, setExito] = useState(false);

  const mostrarError = (mensaje) => {
    setError(mensaje);
    setTimeout(() => setError(""), 3500);
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      setCargando(true);
      try {
        const resultado = await obtenerPacientePorId(id);
        const p = resultado?.data;
        if (!p) { mostrarError("No se encontró el paciente."); return; }
        setFormData({
          nombre: p.nombre || "",
          cedula: p.cedula || "",
          telefono: p.telefono || "",
          correo: p.correo || "",
          fecha_nacimiento: aFechaInput(p.fecha_nacimiento),
        });
        setActivo(p.activo !== false);
      } catch (err) {
        mostrarError(err.message || "No se pudo cargar la información del paciente.");
      } finally {
        setCargando(false);
      }
    })();
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    let valorFinal = value;
    if (name === "cedula") valorFinal = formatearCedula(value);
    if (name === "telefono") valorFinal = formatearTelefono(value);
    setFormData((prev) => ({ ...prev, [name]: valorFinal }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await actualizarPaciente(id, formData);
      setExito(true);
      setTimeout(() => navigate("/pacientes"), 1500);
    } catch (err) {
      mostrarError(err.message || "No se pudo guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex flex-col">
      <header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
        <Link to="/pacientes" className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div className="w-px h-5 bg-[#bec8ce]" />
        <span className="text-2xl">ꨄ︎</span>
        <span className="font-bold text-[#151c27]">Armonía Dental</span>
        <span className="text-[#bec8ce] mx-1">/</span>
        <Link to="/pacientes" className="text-sm text-[#3f484e] hover:text-[#006686] transition-colors">Pacientes</Link>
        <span className="text-[#bec8ce] mx-1">/</span>
        <span className="text-sm font-semibold text-[#006686]">Editar Paciente</span>
      </header>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-[28px] font-bold text-[#151c27]">Editar Paciente</h2>
              <p className="text-sm text-[#3f484e] mt-1">Modifique la información del paciente</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] px-5 py-3 text-sm text-[#ba1a1a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div className="bg-white border border-[#bec8ce] rounded-2xl p-8 shadow-sm">
            {cargando ? (
              <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-lg text-[#006686]" />
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div className="md:col-span-2">
                    <Label>Nombre completo *</Label>
                    <input type="text" name="nombre" placeholder="Ej: Juan Pérez Rodríguez"
                      value={formData.nombre} onChange={onChange} required className={inputCls(false)} />
                  </div>

                  <div>
                    <Label>Cédula *</Label>
                    <input type="text" name="cedula" placeholder="Ej: 2-0987-0654" inputMode="numeric"
                      value={formData.cedula} onChange={onChange} required className={inputCls(false)} />
                  </div>

                  <div>
                    <Label>Fecha de nacimiento</Label>
                    <input type="date" name="fecha_nacimiento"
                      value={formData.fecha_nacimiento} onChange={onChange} className={inputCls(false)} />
                  </div>

                  <div>
                    <Label>Teléfono *</Label>
                    <input type="tel" name="telefono" placeholder="Ej: 8777-2222" inputMode="numeric"
                      value={formData.telefono} onChange={onChange} required className={inputCls(false)} />
                  </div>

                  <div>
                    <Label>Correo electrónico</Label>
                    <input type="email" name="correo" placeholder="correo@ejemplo.com"
                      value={formData.correo} onChange={onChange} className={inputCls(false)} />
                  </div>

                  <div className="md:col-span-2 rounded-xl border border-[#006686]/20 bg-[#7dd3fc20] px-4 py-3 text-xs text-[#006686] flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>
                      Las alergias, enfermedades y antecedentes médicos se actualizan en la historia clínica del
                      paciente (módulo Expedientes).
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => navigate("/pacientes")}
                    className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando}
                    className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60">
                    {guardando ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <><span className="material-symbols-outlined text-[16px]">save</span>Guardar Cambios</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {exito && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
            <div className="bg-[#7dd3fc20] p-3 rounded-xl">
              <span className="material-symbols-outlined text-[#006686]" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#151c27]">Paciente actualizado correctamente</p>
              <p className="text-xs text-[#3f484e] mt-0.5">La información fue actualizada exitosamente</p>
            </div>
            <button onClick={() => setExito(false)} className="text-[#bec8ce] hover:text-[#3f484e] transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditarPaciente;