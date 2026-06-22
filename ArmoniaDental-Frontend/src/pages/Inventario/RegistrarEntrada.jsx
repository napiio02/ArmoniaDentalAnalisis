import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { insumoService } from "../../services/insumoService";

const inputCls =
  "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]";

const hoy = new Date().toISOString().split("T")[0];

const RegistrarEntrada = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [insumoOriginal, setInsumoOriginal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [errorCantidad, setErrorCantidad] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(hoy);

  useEffect(() => {
    const fetchInsumo = async () => {
      try {
        const { data } = await insumoService.getById(id);
        setInsumoOriginal(data);
      } catch {
        setError("No se encontró el insumo.");
      } finally {
        setCargando(false);
      }
    };
    fetchInsumo();
  }, [id]);

  const cantidadNum = Number(cantidad);
  const cantidadValida =
    cantidad !== "" && !isNaN(cantidadNum) && cantidadNum > 0;
  const stockProyectado = insumoOriginal
    ? insumoOriginal.stock_actual + (cantidadValida ? cantidadNum : 0)
    : 0;

  const onChangeCantidad = (e) => {
    const valor = e.target.value;
    setCantidad(valor);
    if (valor === "") {
      setErrorCantidad(null);
    } else if (isNaN(Number(valor)) || Number(valor) <= 0) {
      setErrorCantidad("Ingresá una cantidad válida mayor a 0");
    } else {
      setErrorCantidad(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cantidadValida) {
      setErrorCantidad("Ingresá una cantidad válida mayor a 0");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await insumoService.registrarEntrada(id, cantidadNum, fecha);
      navigate("/inventario");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Error al registrar la entrada. Intentá de nuevo.",
      );
      setGuardando(false);
    }
  };

  // ── Cargando ──
  if (cargando)
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex flex-col">
        <header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
          <span className="text-2xl">ꨄ︎</span>
          <span className="font-bold text-[#151c27]">Armonía Dental</span>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-[#006686]" />
        </div>
      </div>
    );

  // ── Error / no encontrado ──
  if (error && !insumoOriginal)
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex flex-col">
        <header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
          <span className="text-2xl">ꨄ︎</span>
          <span className="font-bold text-[#151c27]">Armonía Dental</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-6 py-4 flex items-center gap-3 text-sm text-[#ba1a1a]">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
          <button
            onClick={() => navigate("/inventario")}
            className="flex items-center gap-2 text-sm font-semibold text-[#006686] hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Volver al inventario
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex flex-col">
      {/* Header */}
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
          Registrar Entrada
        </span>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-[#151c27]">
              Registrar Entrada
            </h2>
            <p className="text-sm text-[#3f484e] mt-1">
              Ingresá la cantidad recibida para sumarla al stock actual
            </p>
          </div>

          <div className="bg-white border border-[#bec8ce] rounded-2xl p-8 shadow-sm">
            {/* Info solo lectura */}
            <div className="bg-[#f0f3ff] rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686]">
                <span className="material-symbols-outlined text-[20px]">
                  move_to_inbox
                </span>
              </div>
              <div>
                <p className="font-semibold text-[#151c27] text-sm">
                  {insumoOriginal.nombre}
                </p>
                <p className="text-xs text-[#3f484e]">
                  {insumoOriginal.codigo} · {insumoOriginal.categoria}
                </p>
              </div>
            </div>

            <form
              className="space-y-5"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              {/* Stock actual */}
              <div className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">
                  Stock actual
                </span>
                <span className="text-lg font-bold text-[#151c27]">
                  {insumoOriginal.stock_actual} {insumoOriginal.unidad}
                </span>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                  Cantidad a ingresar *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej: 50"
                  value={cantidad}
                  onChange={onChangeCantidad}
                  className={`${inputCls} ${errorCantidad ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : ""}`}
                />
                {errorCantidad && (
                  <p className="text-xs text-[#ba1a1a] mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      error
                    </span>
                    {errorCantidad}
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                  Fecha de entrada *
                </label>
                <input
                  type="date"
                  max={hoy}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>

              {/* Stock proyectado */}
              <div className="bg-[#6df5e120] border border-[#6df5e1]/30 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#006b5f] uppercase tracking-wider">
                  Nuevo stock proyectado
                </span>
                <span className="text-lg font-bold text-[#006b5f]">
                  {stockProyectado} {insumoOriginal.unidad}
                </span>
              </div>

              {error && (
                <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>
                  {error}
                </div>
              )}

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
                  disabled={guardando || !cantidadValida}
                  className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                      Registrar entrada
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarEntrada;
