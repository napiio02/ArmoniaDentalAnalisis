import mongoose from "mongoose";

const FRECUENCIA_ENUM = ["Nunca", "Rara vez", "A veces", "Frecuente", "Diario"];

const historiaClinicaSchema = new mongoose.Schema(
  {
    paciente_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
      ref: "Paciente",
    },

    // Datos generales
    contacto_emergencia_nombre: { type: String, trim: true, default: "" },
    contacto_emergencia_telefono: { type: String, trim: true, default: "" },
    padecimientos: { type: String, trim: true, default: "" },
    medicamentos: { type: String, trim: true, default: "" },
    antecedentes_alergicos: { type: String, trim: true, default: "" },
    procedimientos_quirurgicos: { type: String, trim: true, default: "" },

    // Antecedentes clínicos (sí/no + detalle)
    reaccion_anestesico: { type: Boolean, default: false },
    reaccion_anestesico_detalle: { type: String, trim: true, default: "" },

    fumador: { type: Boolean, default: false },
    fumador_frecuencia: { type: String, trim: true, default: "" },

    sangrados_prolongados: { type: Boolean, default: false },
    desmayos: { type: Boolean, default: false },
    dolores_cabeza_frecuentes: { type: Boolean, default: false },
    tension_rigidez_facial: { type: Boolean, default: false },

    // Hábitos generales
    ejercicio: { type: Boolean, default: false },
    horas_sueno: { type: Number, min: 0, max: 24, default: null },
    habitos_alimenticios: { type: String, trim: true, default: "" },
    frecuencia_dulces: { type: String, enum: [...FRECUENCIA_ENUM, ""], default: "" },
    frecuencia_acidos: { type: String, enum: [...FRECUENCIA_ENUM, ""], default: "" },
    frecuencia_gaseosas: { type: String, enum: [...FRECUENCIA_ENUM, ""], default: "" },

    // Hábitos de higiene dental
    pasta_dental: { type: String, trim: true, default: "" },
    tipo_cepillo: { type: String, trim: true, default: "" },
    veces_cepillado_dia: { type: Number, min: 0, max: 20, default: null },
    usa_hilo_dental: { type: Boolean, default: false },
    hilo_dental_frecuencia: { type: String, trim: true, default: "" },
    usa_enjuague_dental: { type: Boolean, default: false },
    enjuague_dental_frecuencia: { type: String, trim: true, default: "" },
    fecha_ultima_limpieza: { type: Date, default: null },

    // Sección exclusiva para mujeres
    aplica_seccion_mujeres: { type: Boolean, default: false },
    embarazada: { type: Boolean, default: false },
    trastornos_ciclo_menstrual: { type: Boolean, default: false },
    problemas_hormonales: { type: Boolean, default: false },

    activo: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: "historias_clinicas",
  }
);

const HistoriaClinicaModel = mongoose.model("HistoriaClinica", historiaClinicaSchema);

export default HistoriaClinicaModel;
