export default function ModalConfirmarEliminar({
  open,
  titulo = "Eliminar elemento",
  mensaje = "Esta acción no se puede deshacer.",
  onConfirmar,
  onCancelar,
  eliminando = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">

        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-full bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">
              delete
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
            className="px-6 py-2.5 bg-[#ba1a1a] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
          >
            {eliminando ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}