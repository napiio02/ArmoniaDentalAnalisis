import { useState } from "react";
import { subirDocumento } from "../services/documentoExpedienteService";

const TIPOS_DOCUMENTO = [
  "Radiografía",
  "Receta",
  "Consentimiento",
  "Resultado de laboratorio",
  "Otro",
];

const FORMATOS_ACEPTADOS = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

const inputCls = (error) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none bg-white text-[#151c27] transition-colors ${
    error ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : "border-[#bec8ce] focus:border-[#006686]"
  }`;

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const getIconoFormato = (nombreArchivo = "") => {
  const ext = nombreArchivo.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "picture_as_pdf";
  if (["doc", "docx"].includes(ext)) return "description";
  if (["jpg", "jpeg", "png"].includes(ext)) return "image";
  return "draft";
};

export default function ModalSubirDocumento({ expedienteId, pacienteId, onClose, onSubido }) {
  const [tipo, setTipo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);

  const handleArchivoChange = (e) => {
    const file = e.target.files?.[0];
    setArchivo(file || null);
    if (errores.archivo) setErrores((prev) => ({ ...prev, archivo: undefined }));
  };

  const validar = () => {
    const e = {};
    if (!tipo) e.tipo = "Seleccione el tipo de documento";
    if (!archivo) e.archivo = "Debe seleccionar un archivo";
    else if (archivo.size > 15 * 1024 * 1024) e.archivo = "El archivo no puede superar los 15MB";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSubiendo(true);
    setError(null);
    try {
      const respuesta = await subirDocumento(expedienteId, {
        tipo,
        paciente_id: pacienteId,
        archivo,
      });
      onSubido?.(respuesta.data);
      onClose();
    } catch (err) {
      setError(err.message || "Error al subir el documento. Intentá de nuevo.");
      setSubiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#151c27]">Añadir documento</h3>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#ba1a1a] mb-4">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">

          {/* Tipo de documento */}
          <div>
            <Label>Tipo de documento *</Label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}
              className={inputCls(errores.tipo)}>
              <option value="">Seleccionar tipo</option>
              {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errores.tipo && <p className="text-xs text-[#ba1a1a] mt-1">{errores.tipo}</p>}
          </div>

          {/* Archivo */}
          <div>
            <Label>Archivo *</Label>
            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              errores.archivo ? "border-[#ba1a1a] bg-[#ffdad6]/20" : "border-[#bec8ce] hover:border-[#006686] hover:bg-[#f0f3ff]"
            }`}>
              <span className="material-symbols-outlined text-[#006686] text-[24px]">
                {archivo ? getIconoFormato(archivo.name) : "upload_file"}
              </span>
              <div className="flex-1 min-w-0">
                {archivo ? (
                  <>
                    <p className="text-sm font-semibold text-[#151c27] truncate">{archivo.name}</p>
                    <p className="text-xs text-[#3f484e]">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#151c27]">Seleccionar archivo</p>
                    <p className="text-xs text-[#3f484e]">PDF, Word, JPG o PNG — máx. 15MB</p>
                  </>
                )}
              </div>
              <input type="file" accept={FORMATOS_ACEPTADOS} onChange={handleArchivoChange} className="hidden" />
            </label>
            {errores.archivo && <p className="text-xs text-[#ba1a1a] mt-1">{errores.archivo}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={subiendo}
              className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60">
              {subiendo ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <><span className="material-symbols-outlined text-[16px]">upload</span>Subir documento</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}