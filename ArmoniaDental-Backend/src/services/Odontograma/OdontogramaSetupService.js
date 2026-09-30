import AccionesModel from "../../models/Odontograma/AccionesModel.js";
import OdontogramaModel from "../../models/Odontograma/OdontogramaModel.js";
import { ACCIONES_ODONTOGRAMA } from "./OdontogramaCatalogo.js";

const INDICE_NUEVO = "odontograma_paciente_expediente_dentadura_activo_unique";

function esIndiceAnterior(indice) {
  const claves = Object.entries(indice.key || {});
  return indice.unique === true
    && claves.length === 3
    && indice.key.paciente_id === 1
    && indice.key.expediente_id === 1
    && indice.key.activo === 1;
}

export async function prepararOdontograma() {
  await AccionesModel.bulkWrite(
    ACCIONES_ODONTOGRAMA.map((accion) => ({
      updateOne: {
        filter: { codigo: accion.codigo },
        update: { $set: { ...accion, grupo_exclusivo: accion.grupo_exclusivo || "", activo: true } },
        upsert: true,
      },
    })),
  );

  const indices = await OdontogramaModel.collection.indexes();
  const anteriores = indices.filter(esIndiceAnterior);
  for (const anterior of anteriores) {
    await OdontogramaModel.collection.dropIndex(anterior.name);
  }

  await OdontogramaModel.collection.createIndex(
    { paciente_id: 1, expediente_id: 1, dentadura: 1, activo: 1 },
    {
      name: INDICE_NUEVO,
      unique: true,
      partialFilterExpression: { activo: true },
    },
  );
}
