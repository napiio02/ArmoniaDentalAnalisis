import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../services/apiClient";
import OdontogramaChart from "../pages/Odontograma/components/OdontogramaChart";

const BACKEND_URL = API_URL.replace(/\/v\d+$/, "");

function getToken() {
  return localStorage.getItem("token");
}

async function fetchOdontograma(pacienteId, expedienteId) {
  const r = await fetch(
    `${BACKEND_URL}/api/odontogramas/paciente/${pacienteId}?expediente_id=${expedienteId}`,
    { credentials: "include", cache: "no-store", headers: { Authorization: `Bearer ${getToken()}` } }
  );
  return r.json();
}

async function fetchAcciones() {
  const r = await fetch(
    `${BACKEND_URL}/api/odontogramas/acciones`,
    { credentials: "include", cache: "no-store", headers: { Authorization: `Bearer ${getToken()}` } }
  );
  return r.json();
}

/* =========================================================
   OdontogramaResumen
   Vista de solo lectura del odontograma en el expediente.
   Reutiliza OdontogramaChart con disabled={true}.
========================================================= */
export default function OdontogramaResumen({ pacienteId, expedienteId }) {
  const [odontogramas, setOdontogramas] = useState(null); // { permanente, temporal }
  const [actionGroups, setActionGroups] = useState([]);
  const [cargando, setCargando]         = useState(false);
  const [error, setError]               = useState(null);
  const [tab, setTab]                   = useState("permanente");

  const cargar = useCallback(async () => {
    if (!pacienteId) return;
    try {
      setCargando(true);
      setError(null);

      const [resOdonto, resAcciones] = await Promise.all([
        fetchOdontograma(pacienteId, expedienteId),
        fetchAcciones(),
      ]);

      // resOdonto.data.odontogramas = { permanente: {...teeth}, temporal: {...teeth}|null }
      // resAcciones.data = [{group, items:[{id,label,color,shortLabel,type}]}]
      setOdontogramas(resOdonto?.data?.odontogramas || null);
      setActionGroups(resAcciones?.data || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar el odontograma.");
    } finally {
      setCargando(false);
    }
  }, [pacienteId, expedienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  const odontogramaPerm = odontogramas?.permanente || null;
  const odontogramaTemp = odontogramas?.temporal   || null;
  const hayDatos = odontogramaPerm || odontogramaTemp;

  // OdontogramaChart espera teeth[numero] = { marks, observacion, historial }
  // que es exactamente lo que retorna convertirOdontograma del backend
  const teethActual = tab === "permanente"
    ? (odontogramaPerm?.teeth || {})
    : (odontogramaTemp?.teeth || {});

  const dentaduraActual = tab === "permanente" ? "permanente" : "temporal";

  return (
    <div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#151c27] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006686] text-[20px]">
            dentistry
          </span>
          Odontograma
        </h3>
        <button
          onClick={cargar}
          disabled={cargando}
          className="text-xs text-[#006686] hover:underline disabled:opacity-40 flex items-center gap-1"
          title="Actualizar odontograma"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          Actualizar
        </button>
      </div>

      {/* Cargando */}
      {cargando && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md text-[#006686]" />
        </div>
      )}

      {/* Error */}
      {!cargando && error && (
        <div className="flex items-center gap-2 py-6 text-sm text-[#ba1a1a]">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* Sin datos */}
      {!cargando && !error && !hayDatos && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">
            dentistry
          </span>
          <p className="text-sm text-[#3f484e]">
            Este paciente aún no tiene odontograma registrado
          </p>
        </div>
      )}

      {/* Diagrama */}
      {!cargando && !error && hayDatos && (
        <>
          {/* Tabs permanente / temporal (solo si ambos existen) */}
          {odontogramaPerm && odontogramaTemp && (
            <div className="flex gap-2 mb-4">
              {["permanente", "temporal"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    tab === t
                      ? "bg-[#006686] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* OdontogramaChart en modo read-only.
              El primer hijo de OdontogramaChart es el div de badges
              ("Clic derecho…") — lo ocultamos con CSS ya que no aplica
              en vista de solo lectura. */}
          <div className="overflow-x-auto [&>div:first-child]:hidden">
            <OdontogramaChart
              dentadura={dentaduraActual}
              teeth={teethActual}
              actionGroups={actionGroups}
              disabled={true}
              selectedTooth={null}
              selectedPatient={null}
              currentFaceAction={null}
              onToothClick={undefined}
              onFaceClick={undefined}
              onContextMenu={undefined}
            />
          </div>

          {/* Notas generales */}
          {(odontogramaPerm?.notas_generales || odontogramaTemp?.notas_generales) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 mb-1">Notas generales</p>
              <p className="text-sm text-gray-700">
                {(tab === "permanente" ? odontogramaPerm : odontogramaTemp)?.notas_generales}
              </p>
            </div>
          )}

          {/* Fecha de última actualización */}
          {odontogramaPerm?.updatedAt && (
            <p className="mt-3 text-[10px] text-gray-400 text-right">
              Última actualización:{" "}
              {new Date(
                (tab === "permanente" ? odontogramaPerm : odontogramaTemp)?.updatedAt
              ).toLocaleDateString("es-CR", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}