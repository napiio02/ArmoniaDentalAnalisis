import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { crearPaciente } from "../../services/pacienteService";
import ModalHistoriaClinica from "../../components/ModalHistoriaClinica";

const ALERGIAS = [
  "Penicilina", "Látex", "Anestesia", "Ibuprofeno",
  "Amoxicilina", "Polen", "Mariscos", "Ninguna",
];
const ENFERMEDADES = [
  "Diabetes", "Hipertensión", "Asma", "Enfermedad cardíaca",
  "Epilepsia", "Artritis", "Tiroides", "Ninguna",
];

const inputCls = (error) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none bg-white text-[#151c27] transition-colors ${
    error ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : "border-[#bec8ce] focus:border-[#006686]"
  }`;

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const FORM_INICIAL = {
  nombre: "", cedula: "", telefono: "", email: "",
  fecha_nacimiento: "", alergias: [], enfermedades: [],
};

// ── Formateo automático de cédula y teléfono (formato CR) ──
const formatearCedula = (valor) => {
  const limpio = valor.replace(/\D/g, "").slice(0, 9); // solo números, máx 9
  if (limpio.length <= 1) return limpio;
  if (limpio.length <= 5) return `${limpio.slice(0, 1)}-${limpio.slice(1)}`;
  return `${limpio.slice(0, 1)}-${limpio.slice(1, 5)}-${limpio.slice(5, 9)}`;
};

const formatearTelefono = (valor) => {
  const limpio = valor.replace(/\D/g, "").slice(0, 8); // solo números, máx 8
  if (limpio.length <= 4) return limpio;
  return `${limpio.slice(0, 4)}-${limpio.slice(4, 8)}`;
};

const NuevoPaciente = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);
  const [errores, setErrores] = useState({});
  const [alergiaSeleccionada, setAlergiaSeleccionada] = useState("");
  const [enfermedadSeleccionada, setEnfermedadSeleccionada] = useState("");
  const [pacienteCreadoId, setPacienteCreadoId] = useState(null);
  const [mostrarHistoriaClinica, setMostrarHistoriaClinica] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    let valorFinal = value;

    if (name === "cedula") valorFinal = formatearCedula(value);
    if (name === "telefono") valorFinal = formatearTelefono(value);

    setFormData((prev) => ({ ...prev, [name]: valorFinal }));
    if (errores[name])
      setErrores((prev) => ({ ...prev, [name]: undefined }));
  };

  const agregarAlergia = (alergia) => {
    if (!alergia) return;
    setFormData((prev) => {
      if (alergia === "Ninguna") return { ...prev, alergias: ["Ninguna"] };
      const actuales = prev.alergias.filter((a) => a !== "Ninguna");
      if (actuales.includes(alergia)) return prev;
      return { ...prev, alergias: [...actuales, alergia] };
    });
  };

  const agregarEnfermedad = (enf) => {
    if (!enf) return;
    setFormData((prev) => {
      if (enf === "Ninguna") return { ...prev, enfermedades: ["Ninguna"] };
      const actuales = prev.enfermedades.filter((e) => e !== "Ninguna");
      if (actuales.includes(enf)) return prev;
      return { ...prev, enfermedades: [...actuales, enf] };
    });
  };

  const validar = () => {
    const e = {};

    if (!formData.nombre.trim())
      e.nombre = "El nombre es obligatorio";

    if (formData.cedula.replace(/\D/g, "").length !== 9)
      e.cedula = "La cédula debe tener 9 dígitos. Ej: 2-0987-0654";

    if (formData.telefono.replace(/\D/g, "").length !== 8)
      e.telefono = "El teléfono debe tener 8 dígitos. Ej: 8777-2222";

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      e.email = "Correo electrónico inválido";

    if (!formData.fecha_nacimiento)
      e.fecha_nacimiento = "La fecha de nacimiento es obligatoria";

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setGuardando(true);
    setError(null);
    try {
      const respuesta = await crearPaciente(formData);
      setGuardando(false);
      setPacienteCreadoId(respuesta.data._id);
      setMostrarHistoriaClinica(true);
    } catch (err) {
      setError(err.message || "Error al guardar el paciente. Intentá de nuevo.");
      setGuardando(false);
    }
  };

  const cerrarHistoriaClinica = () => {
    setMostrarHistoriaClinica(false);
    setExito(true);
    setTimeout(() => navigate("/pacientes"), 1500);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex flex-col">

      {/* Header */}
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
        <span className="text-sm font-semibold text-[#006686]">Nuevo Paciente</span>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl">

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-[#151c27]">Nuevo Paciente</h2>
            <p className="text-sm text-[#3f484e] mt-1">Complete el formulario para registrar un nuevo paciente</p>
          </div>

          {error && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-5 py-3 flex items-center gap-3 mb-5 text-sm text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div className="bg-white border border-[#bec8ce] rounded-2xl p-8 shadow-sm">
            <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Nombre */}
                <div className="md:col-span-2">
                  <Label>Nombre completo *</Label>
                  <input type="text" name="nombre" placeholder="Ej: Carlos Méndez Vargas"
                    value={formData.nombre} onChange={onChange}
                    className={inputCls(errores.nombre)} />
                  {errores.nombre && <p className="text-xs text-[#ba1a1a] mt-1">{errores.nombre}</p>}
                </div>

                {/* Cédula */}
                <div>
                  <Label>Cédula *</Label>
                  <input type="text" name="cedula" placeholder="Ej: 2-0987-0654" inputMode="numeric"
                    value={formData.cedula} onChange={onChange}
                    className={inputCls(errores.cedula)} />
                  {errores.cedula && <p className="text-xs text-[#ba1a1a] mt-1">{errores.cedula}</p>}
                </div>

                {/* Fecha nacimiento */}
                <div>
                  <Label>Fecha de nacimiento *</Label>
                  <input type="date" name="fecha_nacimiento"
                    value={formData.fecha_nacimiento} onChange={onChange}
                    className={inputCls(errores.fecha_nacimiento)} />
                  {errores.fecha_nacimiento && <p className="text-xs text-[#ba1a1a] mt-1">{errores.fecha_nacimiento}</p>}
                </div>

                {/* Teléfono */}
                <div>
                  <Label>Teléfono *</Label>
                  <input type="tel" name="telefono" placeholder="Ej: 8777-2222" inputMode="numeric"
                    value={formData.telefono} onChange={onChange}
                    className={inputCls(errores.telefono)} />
                  {errores.telefono && <p className="text-xs text-[#ba1a1a] mt-1">{errores.telefono}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label>Correo electrónico</Label>
                  <input type="email" name="email" placeholder="carlos.mendez@email.com"
                    value={formData.email} onChange={onChange}
                    className={inputCls(errores.email)} />
                  {errores.email && <p className="text-xs text-[#ba1a1a] mt-1">{errores.email}</p>}
                </div>

                {/* Alergias */}
                <div className="md:col-span-2">
                  <Label>Alergias</Label>
                  <div className="flex gap-2">
                    <select value={alergiaSeleccionada}
                      onChange={(e) => setAlergiaSeleccionada(e.target.value)}
                      className={inputCls(false)}>
                      <option value="">Seleccione una alergia</option>
                      {ALERGIAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <button type="button"
                      onClick={() => { agregarAlergia(alergiaSeleccionada); setAlergiaSeleccionada(""); }}
                      className="px-5 py-2.5 bg-[#006686] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                      Agregar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 min-h-[32px]">
                    {formData.alergias.length > 0 ? (
                      formData.alergias.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#ffddb820] text-[#855300] border border-[#855300]/20">
                          {a}
                          <button type="button"
                            onClick={() => setFormData((p) => ({ ...p, alergias: p.alergias.filter((x) => x !== a) }))}
                            className="hover:opacity-70 transition-opacity font-bold">✕</button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#bec8ce]">No se han agregado alergias</span>
                    )}
                  </div>
                </div>

                {/* Enfermedades */}
                <div className="md:col-span-2">
                  <Label>Enfermedades relevantes</Label>
                  <div className="flex gap-2">
                    <select value={enfermedadSeleccionada}
                      onChange={(e) => setEnfermedadSeleccionada(e.target.value)}
                      className={inputCls(false)}>
                      <option value="">Seleccione una enfermedad</option>
                      {ENFERMEDADES.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <button type="button"
                      onClick={() => { agregarEnfermedad(enfermedadSeleccionada); setEnfermedadSeleccionada(""); }}
                      className="px-5 py-2.5 bg-[#006686] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                      Agregar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 min-h-[32px]">
                    {formData.enfermedades.length > 0 ? (
                      formData.enfermedades.map((enf) => (
                        <span key={enf} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#7dd3fc20] text-[#006686] border border-[#006686]/20">
                          {enf}
                          <button type="button"
                            onClick={() => setFormData((p) => ({ ...p, enfermedades: p.enfermedades.filter((x) => x !== enf) }))}
                            className="hover:opacity-70 transition-opacity font-bold">✕</button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#bec8ce]">No se han agregado enfermedades</span>
                    )}
                  </div>
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
                    <><span className="material-symbols-outlined text-[16px]">check</span>Guardar Paciente</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal historia clínica */}
      {mostrarHistoriaClinica && pacienteCreadoId && (
        <ModalHistoriaClinica
          pacienteId={pacienteCreadoId}
          onClose={cerrarHistoriaClinica}
        />
      )}

      {/* Toast éxito */}
      {exito && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
            <div className="bg-[#6df5e120] p-3 rounded-xl">
              <span className="material-symbols-outlined text-[#006b5f]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#151c27]">Paciente registrado correctamente</p>
              <p className="text-xs text-[#3f484e] mt-0.5">La información fue guardada exitosamente</p>
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

export default NuevoPaciente;