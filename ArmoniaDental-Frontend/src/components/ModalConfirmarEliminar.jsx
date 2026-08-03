export default function ModalConfirmarEliminar({
  open,
  titulo = "Eliminar elemento",
  mensaje = "Esta acción no se puede deshacer.",
  onConfirmar,
  onCancelar,
  eliminando = false,
  textoConfirmar = "Eliminar",
  icono = "delete",
  variante = "peligro",
}) {
  if (!open) return null;

  const esPeligro = variante === "peligro";
  const fondoIcono = esPeligro ? "bg-[#ffdad6]" : "bg-[#7dd3fc20]";
  const colorIcono = esPeligro ? "text-[#ba1a1a]" : "text-[#006686]";
  const fondoBoton = esPeligro ? "bg-[#ba1a1a]" : "bg-[#006686]";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">

        <div className="flex items-start gap-4 mb-5">
          <div className={`w-11 h-11 rounded-full ${fondoIcono} flex items-center justify-center flex-shrink-0`}>
            <span className={`material-symbols-outlined ${colorIcono} text-[22px]`}>
              {icono}
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#151c27]">{titulo}</h3>
            <p className="text-sm text-[#3f484e] mt-1">{mensaje}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={eliminando}
            className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={eliminando}
            className={`px-6 py-2.5 ${fondoBoton} text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60`}
          >
            {eliminando ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">{icono}</span>
                {textoConfirmar}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
