import { useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../../components/Navbar";
import { Package } from "lucide-react";
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

const NuevoInsumo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null); // para errores generales del formulario
  const [errores, setErrores] = useState({}); // para validación de campos individuales

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim())
      nuevosErrores.nombre = "El nombre es obligatorio";
    if (!formData.categoria)
      nuevosErrores.categoria = "La categoría es obligatoria";
    if (formData.stock_actual === "")
      nuevosErrores.stock_actual = "El stock actual es obligatorio";
    if (formData.stock_minimo === "")
      nuevosErrores.stock_minimo = "El stock mínimo es obligatorio";
    if (!formData.unidad.trim())
      nuevosErrores.unidad = "La unidad es obligatoria";
    if (!formData.proveedor.trim())
      nuevosErrores.proveedor = "El proveedor es obligatorio";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return; // ← detiene si hay errores
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
    } catch (err) {
      setError("Error al guardar el insumo. Intentá de nuevo.");
      setGuardando(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="lg:px-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Nuevo Insumo
          </h2>
          <p className="text-gray-600 mb-6">
            Complete el formulario para registrar un nuevo insumo médico
          </p>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <form
              className="space-y-4"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-medium">
                      Nombre del insumo *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    className={`input input-bordered ${errores.nombre ? "input-error" : ""}`}
                    placeholder="Ej: Guantes de nitrilo"
                    value={formData.nombre}
                    onChange={onChange}
                  />
                  {errores.nombre && (
                    <span className="text-error text-sm mt-1">
                      {errores.nombre}
                    </span>
                  )}
                </div>

                {/* Categoría */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Categoría *</span>
                  </label>
                  <select
                    name="categoria"
                    className={`select select-bordered ${errores.categoria ? "select-error" : ""}`}
                    value={formData.categoria}
                    onChange={onChange}
                  >
                    <option value="">Seleccionar categoría</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errores.categoria && (
                    <span className="text-error text-sm mt-1">
                      {errores.categoria}
                    </span>
                  )}
                </div>

                {/* Unidad */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Unidad *</span>
                  </label>
                  <input
                    type="text"
                    name="unidad"
                    className={`input input-bordered ${errores.unidad ? "input-error" : ""}`}
                    placeholder="Ej: Cajas, Unidades, Rollos"
                    value={formData.unidad}
                    onChange={onChange}
                  />
                  {errores.unidad && (
                    <span className="text-error text-sm mt-1">
                      {errores.unidad}
                    </span>
                  )}
                </div>

                {/* Stock actual */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Stock actual *
                    </span>
                  </label>
                  <input
                    type="number"
                    name="stock_actual"
                    min="0"
                    className={`input input-bordered ${errores.stock_actual ? "input-error" : ""}`}
                    placeholder="0"
                    value={formData.stock_actual}
                    onChange={onChange}
                  />
                  {errores.stock_actual && (
                    <span className="text-error text-sm mt-1">
                      {errores.stock_actual}
                    </span>
                  )}
                </div>

                {/* Stock mínimo */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Stock mínimo *
                    </span>
                  </label>
                  <input
                    type="number"
                    name="stock_minimo"
                    min="0"
                    className={`input input-bordered ${errores.stock_minimo ? "input-error" : ""}`}
                    placeholder="5"
                    value={formData.stock_minimo}
                    onChange={onChange}
                  />
                  {errores.stock_minimo && (
                    <span className="text-error text-sm mt-1">
                      {errores.stock_minimo}
                    </span>
                  )}
                </div>

                {/* Fecha de vencimiento */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Fecha de vencimiento
                    </span>
                    <span className="label-text-alt text-gray-400">
                      Opcional
                    </span>
                  </label>
                  <input
                    type="date"
                    name="fecha_vencimiento"
                    className="input input-bordered"
                    value={formData.fecha_vencimiento}
                    onChange={onChange}
                  />
                </div>

                {/* Proveedor */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Proveedor</span>
                  </label>
                  <input
                    type="text"
                    name="proveedor"
                    className="input input-bordered"
                    placeholder="Ej: Dental Plus"
                    value={formData.proveedor}
                    onChange={onChange}
                  />
                  {errores.proveedor && (
                    <span className="text-error text-sm mt-1">
                      {errores.proveedor}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate("/inventario")}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={guardando}
                >
                  {guardando ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    "Guardar Insumo"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast de registrado */}
      {exito && (
        <div className="toast toast-bottom toast-end z-50 mr-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px] max-w-[420px]">
            <div className="bg-green-100 text-green-600 p-3 rounded-xl">
              <Package size={22} />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-gray-800">
                Insumo registrado correctamente
              </p>
              <p className="text-sm text-gray-500 mt-1">
                La información fue guardada exitosamente
              </p>
            </div>
            <button
              onClick={() => setExito(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevoInsumo;
