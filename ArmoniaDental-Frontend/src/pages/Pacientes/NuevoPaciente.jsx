import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { crearPaciente } from "../../services/pacienteService";
import ModalHistoriaClinica from "../../components/ModalHistoriaClinica";

const inputCls = (error) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none bg-white text-[#151c27] transition-colors ${
    error ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : "border-[#bec8ce] focus:border-[#006686]"
  }`;

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const Ayuda = ({ error, children }) =>
  error ? (
    <p className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">error</span>
      {error}
    </p>
  ) : children ? (
    <p className="text-xs text-[#3f484e] mt-1">{children}</p>
  ) : null;

const Seccion = ({ icono, titulo, descripcion, children }) => (
  <section>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-[#7dd3fc20] text-[#006686] flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-[20px]">{icono}</span>
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#151c27]">{titulo}</h3>
        <p className="text-xs text-[#3f484e]">{descripcion}</p>
      </div>
    </div>
    {children}
  </section>
);

const FORM_INICIAL = { nombre: "", cedula: "", fecha_nacimiento: "", telefono: "", correo: "" };
const ORDEN_CAMPOS = ["nombre", "cedula", "fecha_nacimiento", "telefono", "correo"];

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

const hoyCR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });

const calcularEdad = (iso) => {
  if (!iso) return null;
  const [anio, mes, dia] = iso.split("-").map(Number);
  const [ha, hm, hd] = hoyCR().split("-").map(Number);
  let edad = ha - anio;
  if (hm < mes || (hm === mes && hd < dia)) edad--;
  return edad;
};

const PASOS = ["Datos del paciente", "Historia clínica"];

const NuevoPaciente = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [pacienteCreado, setPacienteCreado] = useState(null); // { id, nombre }
  const [exito, setExito] = useState(null); // mensaje del aviso final
  const historiaGuardadaRef = useRef(false);

  const hoy = hoyCR();
  const edad = calcularEdad(formData.fecha_nacimiento);
  const pasoActual = pacienteCreado ? 2 : 1;

  const onChange = (e) => {
    const { name, value } = e.target;
    let valorFinal = value;
    if (name === "cedula") valorFinal = formatearCedula(value);
    if (name === "telefono") valorFinal = formatearTelefono(value);

    setFormData((prev) => ({ ...prev, [name]: valorFinal }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }));
  };

  const validar = () => {
    const e = {};

    if (formData.nombre.trim().length < 3) e.nombre = "Ingrese el nombre completo del paciente";

    if (formData.cedula.replace(/\D/g, "").length !== 9)
      e.cedula = "La cédula debe tener 9 dígitos. Ej: 2-0987-0654";

    if (!formData.fecha_nacimiento) e.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
    else if (formData.fecha_nacimiento > hoy) e.fecha_nacimiento = "La fecha de nacimiento no puede ser futura";
    else if (edad > 120) e.fecha_nacimiento = "Revise la fecha de nacimiento";

    if (formData.telefono.replace(/\D/g, "").length !== 8)
      e.telefono = "El teléfono debe tener 8 dígitos. Ej: 8777-2222";

    if (formData.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo.trim()))
      e.correo = "Correo electrónico inválido";

    setErrores(e);

    // Lleva el foco al primer campo con error
    const primero = ORDEN_CAMPOS.find((c) => e[c]);
    if (primero) document.getElementById(`np-${primero}`)?.focus();

    return !primero;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando || !validar()) return;

    setGuardando(true);
    setError(null);
    try {
      const respuesta = await crearPaciente({
        nombre: formData.nombre.trim(),
        cedula: formData.cedula,
        fecha_nacimiento: formData.fecha_nacimiento,
        telefono: formData.telefono,
        correo: formData.correo.trim(),
      });
      setPacienteCreado({ id: respuesta.data._id, nombre: respuesta.data.nombre || formData.nombre.trim() });
    } catch (err) {
      const mensaje = err.message || "Error al guardar el paciente. Inténtelo de nuevo.";
      // Cédula repetida: se muestra junto al campo
      if (/c[ée]dula/i.test(mensaje)) {
        setErrores((prev) => ({ ...prev, cedula: mensaje }));
        document.getElementById("np-cedula")?.focus();
      } else {
        setError(mensaje);
      }
    } finally {
      setGuardando(false);
    }
  };

  // Al cerrar la historia clínica (guardada o "Completar después") termina el registro
  const finalizarRegistro = () => {
    setExito(
      historiaGuardadaRef.current
        ? "La historia clínica también quedó guardada."
        : "Puede completar la historia clínica más tarde desde Expedientes.",
    );
    setTimeout(() => navigate("/pacientes"), 1800);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#bec8ce] px-4 py-3 sm:px-8 sm:py-4 flex items-center gap-2 sm:gap-3">
        <Link to="/pacientes" aria-label="Volver a Pacientes" className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div className="w-px h-5 bg-[#bec8ce]" />
        <span className="text-2xl">ꨄ︎</span>
        <span className="hidden sm:inline font-bold text-[#151c27]">Armonía Dental</span>
        <span className="hidden sm:inline text-[#bec8ce] mx-1">/</span>
        <Link to="/pacientes" className="text-sm text-[#3f484e] hover:text-[#006686] transition-colors">Pacientes</Link>
        <span className="text-[#bec8ce] mx-1">/</span>
        <span className="text-sm font-semibold text-[#006686]">Nuevo Paciente</span>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-3xl">
          <div className="mb-6">
            <h2 className="text-[28px] font-bold text-[#151c27]">Nuevo Paciente</h2>
            <p className="text-sm text-[#3f484e] mt-1">
              Registre los datos del paciente. En el siguiente paso completará su historia clínica.
            </p>
          </div>

          {/* Pasos */}
          <ol className="flex items-center gap-3 mb-6" aria-label="Pasos del registro">
            {PASOS.map((titulo, i) => {
              const numero = i + 1;
              const completado = numero < pasoActual;
              const activo = numero === pasoActual;
              return (
                <li key={titulo} className="flex items-center gap-3 flex-1" aria-current={activo ? "step" : undefined}>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      completado || activo ? "bg-[#006686] text-white" : "bg-[#dce2f3] text-[#3f484e]"
                    }`}
                  >
                    {completado ? <span className="material-symbols-outlined text-[16px]">check</span> : numero}
                  </span>
                  <span className={`text-sm font-semibold ${activo ? "text-[#151c27]" : "text-[#3f484e]"}`}>{titulo}</span>
                  {numero < PASOS.length && <span className="flex-1 h-px bg-[#bec8ce]" />}
                </li>
              );
            })}
          </ol>

          {error && (
            <div role="alert" className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-5 py-3 flex items-center gap-3 mb-5 text-sm text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            noValidate
            className="bg-white border border-[#bec8ce] rounded-2xl shadow-sm divide-y divide-[#bec8ce]/60"
          >
            <div className="p-5 sm:p-8 space-y-8">
              <Seccion icono="badge" titulo="Datos personales" descripcion="Identificación del paciente">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Label htmlFor="np-nombre">Nombre completo *</Label>
                    <input id="np-nombre" type="text" name="nombre" placeholder="Ej: Carlos Méndez Vargas"
                      value={formData.nombre} onChange={onChange} aria-invalid={Boolean(errores.nombre)}
                      className={inputCls(errores.nombre)} />
                    <Ayuda error={errores.nombre} />
                  </div>

                  <div>
                    <Label htmlFor="np-cedula">Cédula *</Label>
                    <input id="np-cedula" type="text" name="cedula" placeholder="Ej: 2-0987-0654" inputMode="numeric"
                      value={formData.cedula} onChange={onChange} aria-invalid={Boolean(errores.cedula)}
                      className={inputCls(errores.cedula)} />
                    <Ayuda error={errores.cedula} />
                  </div>

                  <div>
                    <Label htmlFor="np-fecha_nacimiento">Fecha de nacimiento *</Label>
                    <input id="np-fecha_nacimiento" type="date" name="fecha_nacimiento" max={hoy}
                      value={formData.fecha_nacimiento} onChange={onChange} aria-invalid={Boolean(errores.fecha_nacimiento)}
                      className={inputCls(errores.fecha_nacimiento)} />
                    <Ayuda error={errores.fecha_nacimiento}>
                      {edad !== null && edad >= 0 && edad <= 120 ? `Edad: ${edad} ${edad === 1 ? "año" : "años"}` : null}
                    </Ayuda>
                  </div>
                </div>
              </Seccion>

              <Seccion icono="call" titulo="Contacto" descripcion="Para avisos de citas y envío de comprobantes">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="np-telefono">Teléfono *</Label>
                    <input id="np-telefono" type="tel" name="telefono" placeholder="Ej: 8777-2222" inputMode="numeric"
                      value={formData.telefono} onChange={onChange} aria-invalid={Boolean(errores.telefono)}
                      className={inputCls(errores.telefono)} />
                    <Ayuda error={errores.telefono}>Recibirá las confirmaciones y recordatorios de citas por WhatsApp.</Ayuda>
                  </div>

                  <div>
                    <Label htmlFor="np-correo">Correo electrónico</Label>
                    <input id="np-correo" type="email" name="correo" placeholder="carlos.mendez@email.com"
                      value={formData.correo} onChange={onChange} aria-invalid={Boolean(errores.correo)}
                      className={inputCls(errores.correo)} />
                    <Ayuda error={errores.correo}>Opcional. Se usa para enviar comprobantes.</Ayuda>
                  </div>
                </div>
              </Seccion>

              <div className="rounded-xl border border-[#006686]/20 bg-[#7dd3fc20] px-4 py-3 text-xs text-[#006686] flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px]">medical_information</span>
                <span>
                  Las alergias, enfermedades y demás antecedentes médicos se registran en el paso 2, en la historia
                  clínica del paciente.
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-5 py-4 sm:px-8 sm:py-5 bg-[#f9f9ff] rounded-b-2xl">
              <button type="button" onClick={() => navigate("/pacientes")}
                className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-white border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={guardando || Boolean(pacienteCreado)}
                className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60">
                {guardando ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <>
                    Guardar y continuar
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Paso 2: historia clínica */}
      {pacienteCreado && !exito && (
        <ModalHistoriaClinica
          pacienteId={pacienteCreado.id}
          pacienteNombre={pacienteCreado.nombre}
          pasoRegistro
          onGuardado={() => {
            historiaGuardadaRef.current = true;
          }}
          onClose={finalizarRegistro}
        />
      )}

      {/* Aviso final */}
      {exito && (
        <div className="fixed bottom-6 right-6 z-50" role="status">
          <div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
            <div className="bg-[#6df5e120] p-3 rounded-xl">
              <span className="material-symbols-outlined text-[#006b5f]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#151c27]">Paciente registrado correctamente</p>
              <p className="text-xs text-[#3f484e] mt-0.5">{exito}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevoPaciente;
