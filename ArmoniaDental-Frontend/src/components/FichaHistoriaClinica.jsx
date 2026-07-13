import { useState } from "react";

const SiNo = ({ value }) => (
  <span
    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
      value
        ? "bg-[#ffdad620] text-[#ba1a1a] border-[#ba1a1a]/20"
        : "bg-[#f0f3ff] text-[#3f484e] border-[#bec8ce]"
    }`}
  >
    {value ? "Sí" : "No"}
  </span>
);

const Dato = ({ label, value }) => (
  <div className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-3">
    <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className="text-xs font-semibold text-[#151c27]">{value || "No registrado"}</p>
  </div>
);

const DatoBool = ({ label, value, detalle }) => (
  <div className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-3 flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-[#151c27]">{label}</p>
      {value && detalle && (
        <p className="text-[11px] text-[#3f484e] mt-0.5 truncate">{detalle}</p>
      )}
    </div>
    <SiNo value={value} />
  </div>
);

const SeccionTitulo = ({ children }) => (
  <p className="text-[11px] font-bold text-[#006686] uppercase tracking-wider mt-4 mb-2">
    {children}
  </p>
);

const formatearFecha = (fecha) => {
  if (!fecha) return null;
  return new Date(
    new Date(fecha).toISOString().split("T")[0] + "T12:00:00"
  ).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function FichaHistoriaClinica({ historia, onEditar, onRegistrar }) {
  const [abierto, setAbierto] = useState(false);

  if (!historia) {
    return (
      <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-[#151c27] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006686] text-[20px]">assignment</span>
            Ficha de historia clínica
          </h3>
        </div>
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">assignment_late</span>
          <p className="text-sm text-[#3f484e] mb-4">
            Este paciente aún no tiene una historia clínica registrada.
          </p>
          <button
            onClick={onRegistrar}
            className="px-5 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Registrar historia clínica
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#bec8ce] rounded-xl shadow-sm overflow-hidden">
      {/* ── Header clickeable (dropdown toggle) ── */}
      <button
        onClick={() => setAbierto((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#f9f9ff] transition-colors"
      >
        <h3 className="font-semibold text-[#151c27] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006686] text-[20px]">assignment</span>
          Ficha de historia clínica
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#006686] bg-[#f0f3ff] px-2.5 py-1 rounded-full border border-[#006686]/20">
            {abierto ? "Ocultar" : "Ver ficha"}
          </span>
          <span className={`material-symbols-outlined text-[#3f484e] text-[20px] transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </div>
      </button>

      {/* ── Contenido desplegable ── */}
      {abierto && (
        <div className="px-6 pb-6 border-t border-[#bec8ce]">
          <div className="flex justify-end pt-4 mb-2">
            <button
              onClick={onEditar}
              className="px-4 py-2 bg-[#f0f3ff] text-[#006686] border border-[#006686]/30 rounded-full text-xs font-semibold hover:bg-[#dce2f3] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Editar
            </button>
          </div>

          <SeccionTitulo>Contacto de emergencia</SeccionTitulo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Dato label="Nombre" value={historia.contacto_emergencia_nombre} />
            <Dato label="Teléfono" value={historia.contacto_emergencia_telefono} />
          </div>

          <SeccionTitulo>Antecedentes médicos</SeccionTitulo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Dato label="Padecimientos" value={historia.padecimientos} />
            <Dato label="Medicamentos que toma" value={historia.medicamentos} />
            <Dato label="Antecedentes alérgicos" value={historia.antecedentes_alergicos} />
            <Dato label="Procedimientos quirúrgicos" value={historia.procedimientos_quirurgicos} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <DatoBool label="Reacción con anestésico dental" value={historia.reaccion_anestesico}
              detalle={historia.reaccion_anestesico_detalle} />
            <DatoBool label="Fumador" value={historia.fumador} detalle={historia.fumador_frecuencia} />
            <DatoBool label="Sangrados prolongados" value={historia.sangrados_prolongados} />
            <DatoBool label="Desmayos" value={historia.desmayos} />
            <DatoBool label="Dolores de cabeza frecuentes" value={historia.dolores_cabeza_frecuentes} />
            <DatoBool label="Tensión o rigidez facial" value={historia.tension_rigidez_facial} />
          </div>

          <SeccionTitulo>Hábitos generales</SeccionTitulo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DatoBool label="Realiza ejercicio" value={historia.ejercicio} />
            <Dato label="Horas de sueño" value={historia.horas_sueno || historia.horas_sueno === 0 ? `${historia.horas_sueno} hrs` : null} />
            <Dato label="Hábitos alimenticios" value={historia.habitos_alimenticios} />
            <Dato label="Frecuencia de alimentos dulces" value={historia.frecuencia_dulces} />
            <Dato label="Frecuencia de alimentos ácidos" value={historia.frecuencia_acidos} />
            <Dato label="Frecuencia de gaseosas" value={historia.frecuencia_gaseosas} />
          </div>

          <SeccionTitulo>Higiene dental</SeccionTitulo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Dato label="Pasta dental" value={historia.pasta_dental} />
            <Dato label="Tipo de cepillo" value={historia.tipo_cepillo} />
            <Dato label="Veces de cepillado al día" value={historia.veces_cepillado_dia} />
            <Dato label="Fecha última limpieza dental" value={formatearFecha(historia.fecha_ultima_limpieza)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <DatoBool label="Usa hilo dental" value={historia.usa_hilo_dental} detalle={historia.hilo_dental_frecuencia} />
            <DatoBool label="Usa enjuague dental" value={historia.usa_enjuague_dental} detalle={historia.enjuague_dental_frecuencia} />
          </div>

          {historia.aplica_seccion_mujeres && (
            <>
              <SeccionTitulo>Para mujeres</SeccionTitulo>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DatoBool label="Está embarazada" value={historia.embarazada} />
                <DatoBool label="Trastornos del ciclo menstrual" value={historia.trastornos_ciclo_menstrual} />
                <DatoBool label="Problemas hormonales" value={historia.problemas_hormonales} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}