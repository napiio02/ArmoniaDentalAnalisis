import mongoose from "mongoose";

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/*
 * Configuración única de la agenda (un solo documento): horario de atención,
 * días fijos sin atención y fechas específicas sin atención.
 */
const configuracionAgendaSchema = new mongoose.Schema(
  {
    clave: { type: String, default: "principal", unique: true },

    horaInicio: { type: String, default: "09:00", match: HORA_RE },
    horaFin: { type: String, default: "18:00", match: HORA_RE },

    // 0 = domingo ... 6 = sábado
    diasNoLaborables: { type: [Number], default: [0] },

    fechasNoLaborables: {
      type: [
        {
          _id: false,
          fecha: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
          motivo: { type: String, trim: true, default: "", maxlength: 120 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true, collection: "configuracion_agenda" }
);

const ConfiguracionAgendaModel = mongoose.model("ConfiguracionAgenda", configuracionAgendaSchema);

export default ConfiguracionAgendaModel;
