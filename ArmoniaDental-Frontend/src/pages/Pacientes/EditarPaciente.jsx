import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { obtenerPacientePorId, actualizarPaciente } from "../../services/pacienteService";

const ALERGIAS = [
  "Penicilina",
  "Látex",
  "Anestesia",
  "Ibuprofeno",
  "Amoxicilina",
  "Polen",
  "Mariscos",
  "Ninguna",
];
const ENFERMEDADES = [
  "Diabetes",
  "Hipertensión",
  "Asma",
  "Enfermedad cardíaca",
  "Epilepsia",
  "Artritis",
  "Tiroides",
  "Ninguna",
];

const inputCls =
  "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]";

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

// El input type="date" necesita "YYYY-MM-DD", pero el backend devuelve
// un ISO completo ("2026-07-10T00:00:00.000Z"). Este helper hace la conversión.
const aFechaInput = (isoString) => {
  if (!isoString) return "";
  return isoString.split("T")[0];
};

const FORM_VACIO = {
  nombre: "",
  cedula: "",
  telefono: "",
  correo: "",
  fecha_nacimiento: "",
  alergias: [],
  enfermedades: [],
};

const EditarPaciente = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [alergiaSeleccionada, setAlergiaSeleccionada] = useState("");
  const [enfermedadSeleccionada, setEnfermedadSeleccionada] = useState("");

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

        if (!p) {
          mostrarError("No se encontró el paciente.");
          return;
        }

        setFormData({
          nombre: p.nombre || "",
          cedula: p.cedula || "",
          telefono: p.telefono || "",
          correo: p.correo || "",
          fecha_nacimiento: aFechaInput(p.fecha_nacimiento),
          alergias: p.alergias || [],
          enfermedades: p.enfermedades || [],
        });
      } catch (err) {
        mostrarError(err.message || "No se pudo cargar la información del paciente.");
      } finally {
        setCargando(false);
      }
    })();
  }, [id]);

  const onChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
        <Link
          to="/pacientes"
          className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div className="w-px h-5 bg-[#bec8ce]" />
        <span className="text-2xl">ꨄ︎</span>
        <span className="font-bold text-[#151c27]">Armonía Dental</span>
        <span className="text-[#bec8ce] mx-1">/</span>
        <Link
          to="/pacientes"
          className="text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
        >
          Pacientes
        </Link>
        <span className="text-[#bec8ce] mx-1">/</span>
        <span className="text-sm font-semibold text-[#006686]">Editar Paciente</span>
      </header>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-[#151c27]">Editar Paciente</h2>
            <p className="text-sm text-[#3f484e] mt-1">
              Modifique la información del paciente
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] px-5 py-3 text-sm text-[#ba1a1a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div className="bg-white border border-[#bec8ce] rounded-2xl p-8 shadow-sm">
            {cargando ? (
              <p className="text-sm text-[#3f484e] text-center py-10">
                Cargando información del paciente…
              </p>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Label>Nombre completo *</Label>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Ej: Juan Pérez Rodríguez"
                      value={formData.nombre}
                      onChange={onChange}
                      required
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <Label>Cédula *</Label>
                    <input
                      type="text"
                      name="cedula"
                      placeholder="Ej: 112345678"
                      value={formData.cedula}
                      onChange={onChange}
                      required
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <Label>Fecha de nacimiento</Label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={onChange}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <Label>Teléfono *</Label>
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="Ej: 88001122"
                      value={formData.telefono}
                      onChange={onChange}
                      required
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <Label>Correo electrónico</Label>
                    <input
                      type="email"
                      name="correo"
                      placeholder="correo@ejemplo.com"
                      value={formData.correo}
                      onChange={onChange}
                      className={inputCls}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Alergias</Label>
                    <div className="flex gap-2">
                      <select
                        value={alergiaSeleccionada}
                        onChange={(e) => setAlergiaSeleccionada(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Seleccione una alergia</option>
                        {ALERGIAS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          agregarAlergia(alergiaSeleccionada);
                          setAlergiaSeleccionada("");
                        }}
                        className="px-5 py-2.5 bg-[#006686] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Agregar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 min-h-[32px]">
                      {formData.alergias.length > 0 ? (
                        formData.alergias.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#ffddb820] text-[#855300] border border-[#855300]/20"
                          >
                            {a}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((p) => ({
                                  ...p,
                                  alergias: p.alergias.filter((x) => x !== a),
                                }))
                              }
                              className="hover:opacity-70 transition-opacity font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#bec8ce]">
                          No se han agregado alergias
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Enfermedades relevantes</Label>
                    <div className="flex gap-2">
                      <select
                        value={enfermedadSeleccionada}
                        onChange={(e) => setEnfermedadSeleccionada(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Seleccione una enfermedad</option>
                        {ENFERMEDADES.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          agregarEnfermedad(enfermedadSeleccionada);
                          setEnfermedadSeleccionada("");
                        }}
                        className="px-5 py-2.5 bg-[#006686] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Agregar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 min-h-[32px]">
                      {formData.enfermedades.length > 0 ? (
                        formData.enfermedades.map((enf) => (
                          <span
                            key={enf}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#7dd3fc20] text-[#006686] border border-[#006686]/20"
                          >
                            {enf}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((p) => ({
                                  ...p,
                                  enfermedades: p.enfermedades.filter((x) => x !== enf),
                                }))
                              }
                              className="hover:opacity-70 transition-opacity font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#bec8ce]">
                          No se han agregado enfermedades
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/pacientes")}
                    className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Guardar Cambios
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
              <span
                className="material-symbols-outlined text-[#006686]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                edit
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#151c27]">
                Paciente actualizado correctamente
              </p>
              <p className="text-xs text-[#3f484e] mt-0.5">
                La información fue actualizada exitosamente
              </p>
            </div>
            <button
              onClick={() => setExito(false)}
              className="text-[#bec8ce] hover:text-[#3f484e] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditarPaciente;