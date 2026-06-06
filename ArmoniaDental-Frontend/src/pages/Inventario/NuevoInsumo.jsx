import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { insumoService } from "../../services/insumoService";

const CATEGORIAS = [
  "Protección",
  "Anestesia",
  "Materiales restaurativos",
  "Cirugía",
  "Instrumental",
  "Prevención",
  "Ortodoncia",
  "Diagnóstico",
];

const FORM_INICIAL = {
  nombre: "",
  categoria: "",
  stock_actual: "",
  stock_minimo: "",
  unidad: "",
  proveedor: "",
  fecha_vencimiento: "",
};

const Label = ({ children, optional }) => (
  <div className="flex justify-between mb-1.5">
    <label className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">
      {children}
    </label>
    {optional && <span className="text-xs text-[#bec8ce]">Opcional</span>}
  </div>
);

const inputCls = (error) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none bg-white text-[#151c27] transition-colors ${
    error
      ? "border-[#ba1a1a] focus:border-[#ba1a1a]"
      : "border-[#bec8ce] focus:border-[#006686]"
  }`;

const NuevoInsumo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);
  const [errores, setErrores] = useState({});

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errores[e.target.name])
      setErrores((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validar = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!formData.categoria) e.categoria = "La categoría es obligatoria";
    if (formData.stock_actual === "")
      e.stock_actual = "El stock actual es obligatorio";
    if (formData.stock_minimo === "")
      e.stock_minimo = "El stock mínimo es obligatorio";
    if (!formData.unidad.trim()) e.unidad = "La unidad es obligatoria";
    if (!formData.proveedor.trim()) e.proveedor = "El proveedor es obligatorio";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setGuardando(true);
    setError(null);
    try {
      await insumoService.create({
        ...formData,
        stock_actual: Number(formData.stock_actual),
        stock_minimo: Number(formData.stock_minimo),
        fecha_vencimiento: formData.fecha_vencimiento || null,
      });
      setExito(true);
      setTimeout(() => navigate("/inventario"), 1500);
    } catch {
      setError("Error al guardar el insumo. Intentá de nuevo.");
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex flex-col">
      {/* Header simple sin sidebar */}
      <header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
        <Link
          to="/inventario"
          className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
        </Link>
        <div className="w-px h-5 bg-[#bec8ce]" />
        <span className="text-2xl">ꨄ︎</span>
        <span className="font-bold text-[#151c27]">Armonía Dental</span>
        <span className="text-[#bec8ce] mx-1">/</span>
        <Link
          to="/inventario"
          className="text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
        >
          Inventario
        </Link>
        <span className="text-[#bec8ce] mx-1">/</span>
        <span className="text-sm font-semibold text-[#006686]">
          Nuevo Insumo
        </span>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-[#151c27]">
              Nuevo Insumo
            </h2>
            <p className="text-sm text-[#3f484e] mt-1">
              Complete el formulario para registrar un nuevo insumo médico
            </p>
          </div>

          {error && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-5 py-3 flex items-center gap-3 mb-5 text-sm text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>
              {error}
            </div>
          )}

          <div className="bg-white border border-[#bec8ce] rounded-2xl p-8 shadow-sm">
            <form
              className="space-y-5"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <Label>Nombre del insumo *</Label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Ej: Guantes de nitrilo"
                    value={formData.nombre}
                    onChange={onChange}
                    className={inputCls(errores.nombre)}
                  />
                  {errores.nombre && (
                    <p className="text-xs text-[#ba1a1a] mt-1">
                      {errores.nombre}
                    </p>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <Label>Categoría *</Label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={onChange}
                    className={inputCls(errores.categoria)}
                  >
                    <option value="">Seleccionar categoría</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errores.categoria && (
                    <p className="text-xs text-[#ba1a1a] mt-1">
                      {errores.categoria}
                    </p>
                  )}
                </div>

                {/* Unidad */}
                <div>
                  <Label>Unidad *</Label>
                  <input
                    type="text"
                    name="unidad"
                    placeholder="Ej: Cajas, Unidades, Rollos"
                    value={formData.unidad}
                    onChange={onChange}
                    className={inputCls(errores.unidad)}
                  />
                  {errores.unidad && (
                    <p className="text-xs text-[#ba1a1a] mt-1">
                      {errores.unidad}
                    </p>
                  )}
                </div>

                {/* Stock actual */}
                <div>
                  <Label>Stock actual *</Label>
                  <input
                    type="number"
                    name="stock_actual"
                    min="0"
                    placeholder="0"
                    value={formData.stock_actual}
                    onChange={onChange}
                    className={inputCls(errores.stock_actual)}
                  />
                  {errores.stock_actual && (
                    <p className="text-xs text-[#ba1a1a] mt-1">
                      {errores.stock_actual}
                    </p>
                  )}
                </div>

                {/* Stock mínimo */}
                <div>
                  <Label>Stock mínimo *</Label>
                  <input
                    type="number"
                    name="stock_minimo"
                    min="0"
                    placeholder="5"
                    value={formData.stock_minimo}
                    onChange={onChange}
                    className={inputCls(errores.stock_minimo)}
                  />
                  {errores.stock_minimo && (
                    <p className="text-xs text-[#ba1a1a] mt-1">
                      {errores.stock_minimo}
                    </p>
                  )}
                </div>

                {/* Fecha vencimiento */}
                <div>
                  <Label optional>Fecha de vencimiento</Label>
                  <input
                    type="date"
                    name="fecha_vencimiento"
                    value={formData.fecha_vencimiento}
                    onChange={onChange}
                    className={inputCls(false)}
                  />
                </div>

                {/* Proveedor */}
                <div>
                  <Label>Proveedor *</Label>
                  <input
                    type="text"
                    name="proveedor"
                    placeholder="Ej: Dental Plus"
                    value={formData.proveedor}
                    onChange={onChange}
                    className={inputCls(errores.proveedor)}
                  />
                  {errores.proveedor && (
                    <p className="text-xs text-[#ba1a1a] mt-1">
                      {errores.proveedor}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/inventario")}
                  className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                      Guardar Insumo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast éxito */}
      {exito && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
            <div className="bg-[#6df5e120] p-3 rounded-xl">
              <span
                className="material-symbols-outlined text-[#006b5f]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#151c27]">
                Insumo registrado correctamente
              </p>
              <p className="text-xs text-[#3f484e] mt-0.5">
                La información fue guardada exitosamente
              </p>
            </div>
            <button
              onClick={() => setExito(false)}
              className="text-[#bec8ce] hover:text-[#3f484e] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevoInsumo;
