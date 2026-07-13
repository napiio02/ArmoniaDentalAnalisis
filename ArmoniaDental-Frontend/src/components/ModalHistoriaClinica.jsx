import { useState } from "react";
import { crearHistoriaClinica } from "../services/pacienteService";

const FRECUENCIAS = ["Nunca", "Rara vez", "A veces", "Frecuente", "Diario"];

const inputCls =
  "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none bg-white text-[#151c27] border-[#bec8ce] focus:border-[#006686] transition-colors";

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const SeccionTitulo = ({ children }) => (
  <h4 className="text-sm font-bold text-[#006686] mt-6 mb-3 pb-2 border-b border-[#bec8ce]">
    {children}
  </h4>
);

// Interruptor Sí / No
const ToggleSiNo = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-[#151c27]">{label}</span>
    <div className="flex rounded-full border border-[#bec8ce] overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
          value ? "bg-[#006686] text-white" : "bg-white text-[#3f484e] hover:bg-[#f0f3ff]"
        }`}
      >
        Sí
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
          !value ? "bg-[#006686] text-white" : "bg-white text-[#3f484e] hover:bg-[#f0f3ff]"
        }`}
      >
        No
      </button>
    </div>
  </div>
);

const FORM_INICIAL = {
  contacto_emergencia_nombre: "",
  contacto_emergencia_telefono: "",
  padecimientos: "",
  medicamentos: "",
  antecedentes_alergicos: "",
  procedimientos_quirurgicos: "",

  reaccion_anestesico: false,
  reaccion_anestesico_detalle: "",

  fumador: false,
  fumador_frecuencia: "",

  sangrados_prolongados: false,
  desmayos: false,
  dolores_cabeza_frecuentes: false,
  tension_rigidez_facial: false,

  ejercicio: false,
  horas_sueno: "",
  habitos_alimenticios: "",
  frecuencia_dulces: "",
  frecuencia_acidos: "",
  frecuencia_gaseosas: "",

  pasta_dental: "",
  tipo_cepillo: "",
  veces_cepillado_dia: "",
  usa_hilo_dental: false,
  hilo_dental_frecuencia: "",
  usa_enjuague_dental: false,
  enjuague_dental_frecuencia: "",
  fecha_ultima_limpieza: "",

  aplica_seccion_mujeres: false,
  embarazada: false,
  trastornos_ciclo_menstrual: false,
  problemas_hormonales: false,
};

const soloFecha = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toISOString().split("T")[0];
};

export default function ModalHistoriaClinica({ pacienteId, historiaExistente, onClose, onGuardado }) {
  const [formData, setFormData] = useState(() =>
    historiaExistente
      ? {
          ...FORM_INICIAL,
          ...historiaExistente,
          fecha_ultima_limpieza: soloFecha(historiaExistente.fecha_ultima_limpieza),
          horas_sueno: historiaExistente.horas_sueno ?? "",
          veces_cepillado_dia: historiaExistente.veces_cepillado_dia ?? "",
        }
      : FORM_INICIAL
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const set = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const onChangeTexto = (e) => set(e.target.name, e.target.value);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const datos = {
        ...formData,
        horas_sueno: formData.horas_sueno === "" ? null : Number(formData.horas_sueno),
        veces_cepillado_dia:
          formData.veces_cepillado_dia === "" ? null : Number(formData.veces_cepillado_dia),
        fecha_ultima_limpieza: formData.fecha_ultima_limpieza || null,
      };
      const respuesta = await crearHistoriaClinica(pacienteId, datos);
      onGuardado?.(respuesta.data);
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar la historia clínica. Intentá de nuevo.");
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#bec8ce]">
          <div>
            <h3 className="text-lg font-bold text-[#151c27]">
              {historiaExistente ? "Editar historia clínica" : "Historia clínica del paciente"}
            </h3>
            <p className="text-xs text-[#3f484e] mt-0.5">
              {historiaExistente
                ? "Actualice el cuestionario de salud del paciente"
                : "Complete el cuestionario de salud del paciente recién registrado"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <form id="form-historia-clinica" onSubmit={handleGuardar} className="overflow-y-auto px-6 py-4 flex-1">
          {error && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#ba1a1a] mb-4">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <SeccionTitulo>Contacto de emergencia</SeccionTitulo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre del contacto</Label>
              <input type="text" name="contacto_emergencia_nombre" value={formData.contacto_emergencia_nombre}
                onChange={onChangeTexto} className={inputCls} placeholder="Ej: María Vargas" />
            </div>
            <div>
              <Label>Teléfono del contacto</Label>
              <input type="tel" name="contacto_emergencia_telefono" value={formData.contacto_emergencia_telefono}
                onChange={onChangeTexto} className={inputCls} placeholder="Ej: 8888-8888" />
            </div>
          </div>

          <SeccionTitulo>Antecedentes médicos</SeccionTitulo>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Padecimientos</Label>
              <textarea name="padecimientos" value={formData.padecimientos} onChange={onChangeTexto}
                className={inputCls} rows={2} placeholder="Ej: Hipertensión, diabetes..." />
            </div>
            <div>
              <Label>Medicamentos que toma</Label>
              <textarea name="medicamentos" value={formData.medicamentos} onChange={onChangeTexto}
                className={inputCls} rows={2} />
            </div>
            <div>
              <Label>Antecedentes alérgicos</Label>
              <textarea name="antecedentes_alergicos" value={formData.antecedentes_alergicos} onChange={onChangeTexto}
                className={inputCls} rows={2} />
            </div>
            <div>
              <Label>Procedimientos quirúrgicos</Label>
              <textarea name="procedimientos_quirurgicos" value={formData.procedimientos_quirurgicos} onChange={onChangeTexto}
                className={inputCls} rows={2} />
            </div>
          </div>

          <div className="divide-y divide-[#f0f3ff]">
            <ToggleSiNo label="¿Ha presentado alguna reacción con el anestésico dental?"
              value={formData.reaccion_anestesico} onChange={(v) => set("reaccion_anestesico", v)} />
            {formData.reaccion_anestesico && (
              <div className="pb-3">
                <input type="text" name="reaccion_anestesico_detalle" value={formData.reaccion_anestesico_detalle}
                  onChange={onChangeTexto} className={inputCls} placeholder="Describa la reacción" />
              </div>
            )}

            <ToggleSiNo label="¿Es fumador?" value={formData.fumador} onChange={(v) => set("fumador", v)} />
            {formData.fumador && (
              <div className="pb-3">
                <input type="text" name="fumador_frecuencia" value={formData.fumador_frecuencia}
                  onChange={onChangeTexto} className={inputCls} placeholder="Frecuencia (Ej: 5 cigarrillos al día)" />
              </div>
            )}

            <ToggleSiNo label="¿Presenta sangrados prolongados?" value={formData.sangrados_prolongados}
              onChange={(v) => set("sangrados_prolongados", v)} />
            <ToggleSiNo label="¿Padece de desmayos?" value={formData.desmayos}
              onChange={(v) => set("desmayos", v)} />
            <ToggleSiNo label="¿Dolores de cabeza frecuentes?" value={formData.dolores_cabeza_frecuentes}
              onChange={(v) => set("dolores_cabeza_frecuentes", v)} />
            <ToggleSiNo label="¿Tensión o rigidez facial?" value={formData.tension_rigidez_facial}
              onChange={(v) => set("tension_rigidez_facial", v)} />
            <ToggleSiNo label="¿Realiza ejercicio?" value={formData.ejercicio}
              onChange={(v) => set("ejercicio", v)} />
          </div>

          <SeccionTitulo>Hábitos generales</SeccionTitulo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>¿Cuántas horas duerme durante la noche?</Label>
              <input type="number" name="horas_sueno" value={formData.horas_sueno} onChange={onChangeTexto}
                min="0" max="24" className={inputCls} placeholder="Ej: 7" />
            </div>
            <div className="md:col-span-2">
              <Label>Hábitos alimenticios</Label>
              <textarea name="habitos_alimenticios" value={formData.habitos_alimenticios} onChange={onChangeTexto}
                className={inputCls} rows={2} />
            </div>
            <div>
              <Label>¿Con qué frecuencia consume alimentos dulces?</Label>
              <select name="frecuencia_dulces" value={formData.frecuencia_dulces} onChange={onChangeTexto} className={inputCls}>
                <option value="">Seleccione</option>
                {FRECUENCIAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <Label>¿Con qué frecuencia consume alimentos ácidos?</Label>
              <select name="frecuencia_acidos" value={formData.frecuencia_acidos} onChange={onChangeTexto} className={inputCls}>
                <option value="">Seleccione</option>
                {FRECUENCIAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <Label>¿Con qué frecuencia consume gaseosas?</Label>
              <select name="frecuencia_gaseosas" value={formData.frecuencia_gaseosas} onChange={onChangeTexto} className={inputCls}>
                <option value="">Seleccione</option>
                {FRECUENCIAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <SeccionTitulo>Hábitos de higiene dental</SeccionTitulo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>¿Qué pasta dental usa?</Label>
              <input type="text" name="pasta_dental" value={formData.pasta_dental} onChange={onChangeTexto} className={inputCls} />
            </div>
            <div>
              <Label>¿Qué tipo de cepillo usa?</Label>
              <input type="text" name="tipo_cepillo" value={formData.tipo_cepillo} onChange={onChangeTexto} className={inputCls} placeholder="Ej: Cerdas suaves" />
            </div>
            <div>
              <Label>¿Cuántas veces al día se cepilla?</Label>
              <input type="number" name="veces_cepillado_dia" value={formData.veces_cepillado_dia} onChange={onChangeTexto}
                min="0" max="20" className={inputCls} />
            </div>
            <div>
              <Label>Fecha de la última limpieza dental</Label>
              <input type="date" name="fecha_ultima_limpieza" value={formData.fecha_ultima_limpieza} onChange={onChangeTexto} className={inputCls} />
            </div>
          </div>

          <div className="divide-y divide-[#f0f3ff]">
            <ToggleSiNo label="¿Usa hilo dental?" value={formData.usa_hilo_dental}
              onChange={(v) => set("usa_hilo_dental", v)} />
            {formData.usa_hilo_dental && (
              <div className="pb-3">
                <input type="text" name="hilo_dental_frecuencia" value={formData.hilo_dental_frecuencia}
                  onChange={onChangeTexto} className={inputCls} placeholder="Frecuencia (Ej: Diario)" />
              </div>
            )}

            <ToggleSiNo label="¿Usa enjuague dental?" value={formData.usa_enjuague_dental}
              onChange={(v) => set("usa_enjuague_dental", v)} />
            {formData.usa_enjuague_dental && (
              <div className="pb-3">
                <input type="text" name="enjuague_dental_frecuencia" value={formData.enjuague_dental_frecuencia}
                  onChange={onChangeTexto} className={inputCls} placeholder="Frecuencia (Ej: 2 veces al día)" />
              </div>
            )}
          </div>

          <SeccionTitulo>Para mujeres</SeccionTitulo>
          <div className="divide-y divide-[#f0f3ff]">
            <ToggleSiNo label="Aplica esta sección" value={formData.aplica_seccion_mujeres}
              onChange={(v) => set("aplica_seccion_mujeres", v)} />
            {formData.aplica_seccion_mujeres && (
              <>
                <ToggleSiNo label="¿Está usted embarazada?" value={formData.embarazada}
                  onChange={(v) => set("embarazada", v)} />
                <ToggleSiNo label="¿Sufre de trastornos durante el ciclo menstrual?" value={formData.trastornos_ciclo_menstrual}
                  onChange={(v) => set("trastornos_ciclo_menstrual", v)} />
                <ToggleSiNo label="¿Presenta problemas hormonales?" value={formData.problemas_hormonales}
                  onChange={(v) => set("problemas_hormonales", v)} />
              </>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#bec8ce]">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors">
            {historiaExistente ? "Cancelar" : "Completar después"}
          </button>
          <button type="submit" form="form-historia-clinica" disabled={guardando}
            className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60">
            {guardando ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <><span className="material-symbols-outlined text-[16px]">check</span>
                {historiaExistente ? "Guardar cambios" : "Guardar historia clínica"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
