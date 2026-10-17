import { useEffect, useState, useCallback } from "react";
import { obtenerOdontogramaPorPaciente, obtenerAccionesOdontograma } from "../services/odontogramaService";
// ↑ Usa el odontogramaService.js ya existente en el proyecto — no crear uno nuevo.

/* =========================================================
   Constantes de numeración dental (FDI)
========================================================= */
const SUP_DER = [18, 17, 16, 15, 14, 13, 12, 11];
const SUP_IZQ = [21, 22, 23, 24, 25, 26, 27, 28];
const INF_IZQ = [31, 32, 33, 34, 35, 36, 37, 38];
const INF_DER = [41, 42, 43, 44, 45, 46, 47, 48];
const TEMP_SD  = [55, 54, 53, 52, 51];
const TEMP_SI  = [61, 62, 63, 64, 65];
const TEMP_II  = [71, 72, 73, 74, 75];
const TEMP_ID  = [81, 82, 83, 84, 85];

const CIRCLE_FACES = {
  V: "M3,3 L37,3 L27,13 L13,13 Z",
  L: "M13,27 L27,27 L37,37 L3,37 Z",
  M: "M3,3 L13,13 L13,27 L3,37 Z",
  D: "M27,13 L37,3 L37,37 L27,27 Z",
  O: "M13,13 L27,13 L27,27 L13,27 Z",
};

/* =========================================================
   Helpers
========================================================= */
function getActionById(id, acciones = []) {
  return acciones.find((a) => a.codigo === id || a._id === id) || null;
}

function getTopLabels(marks = [], acciones = []) {
  const seen = new Set();
  return marks
    .map((m) => getActionById(m.actionId, acciones))
    .filter(Boolean)
    .filter((a) => ["label", "whole"].includes(a.tipo_render))
    .filter((a) => {
      if (seen.has(a.codigo)) return false;
      seen.add(a.codigo);
      return true;
    })
    .map((a) => ({ text: a.abreviatura, color: a.color }))
    .slice(0, 3);
}

function getFaceColor(marks = [], face, acciones = []) {
  const mark = marks.find((m) => m.area === face);
  if (!mark) return null;
  return getActionById(mark.actionId, acciones)?.color || null;
}

function getWholeAction(marks = [], ids = [], acciones = []) {
  const found = marks.find((m) => ids.includes(m.actionId));
  return found ? getActionById(found.actionId, acciones) : null;
}

/* =========================================================
   Círculo de caras (read-only)
========================================================= */
function FaceCircle({ tooth, acciones }) {
  const marks = tooth?.marks || [];
  const strokeColor = "#49628f";
  const clipId = `resumen-face-clip-${Math.random().toString(36).slice(2)}`;

  const separators = [
    { x1: 7.27, y1: 7.27, x2: 13, y2: 13 },
    { x1: 32.73, y1: 7.27, x2: 27, y2: 13 },
    { x1: 7.27, y1: 32.73, x2: 13, y2: 27 },
    { x1: 32.73, y1: 32.73, x2: 27, y2: 27 },
  ];

  return (
    <svg width={28} height={28} viewBox="0 0 40 40" className="block">
      <defs>
        <clipPath id={clipId}>
          <circle cx="20" cy="20" r="18" />
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="18" fill="#ffffff" />
      {Object.entries(CIRCLE_FACES).map(([face, path]) => {
        const color = getFaceColor(marks, face, acciones);
        return (
          <path key={face} d={path} fill={color || "#ffffff"} clipPath={`url(#${clipId})`} />
        );
      })}
      <g fill="none" stroke={strokeColor} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
        <rect x="13" y="13" width="14" height="14" rx="0.8" />
        {separators.map((line, i) => <line key={i} {...line} />)}
      </g>
      <circle cx="20" cy="20" r="18" fill="none" stroke={strokeColor} strokeWidth="1.55" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* =========================================================
   Columna de pieza (read-only, compacta)
========================================================= */
function ToothMini({ num, upper, tooth, acciones }) {
  const marks = tooth?.marks || [];
  const labels = getTopLabels(marks, acciones);

  const ausente   = getWholeAction(marks, ["ausente"], acciones);
  const endodoncia = getWholeAction(marks, ["endodoncia"], acciones);
  const resto     = getWholeAction(marks, ["resto_radicular"], acciones);
  const corona    = getWholeAction(marks, [
    "corona_metal_porcelana", "corona_libre_metal", "corona_acero_cromado",
  ], acciones);
  const implante  = getWholeAction(marks, ["implante"], acciones);
  const sellante  = getWholeAction(marks, ["sellante"], acciones);
  const exodoncia = getWholeAction(marks, ["indicada_exodoncia"], acciones);

  const baseStroke = "#49628f";
  const rootColor  = endodoncia?.color || resto?.color || null;

  /* SVG simplificado de pieza: rectángulo para corona + raíz */
  const w = 28;
  const h = 60;
  const crownY = upper ? 20 : 0;
  const rootY  = upper ? 0 : 20;

  return (
    <div className="flex flex-col items-center" style={{ gap: 2 }}>
      {/* Etiquetas sobre la pieza */}
      <div className="h-4 flex items-center justify-center gap-0.5">
        {labels.length > 0 ? (
          labels.map((l, i) => (
            <span
              key={i}
              className="text-[6px] font-bold px-0.5 rounded border leading-none"
              style={{ color: l.color, borderColor: `${l.color}55`, backgroundColor: `${l.color}12` }}
            >
              {l.text}
            </span>
          ))
        ) : (
          <span className="text-[6px] text-gray-200">—</span>
        )}
      </div>

      {/* Círculo de caras (arriba para superiores) */}
      {upper && <FaceCircle tooth={tooth} acciones={acciones} />}

      {/* SVG de la pieza */}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        {/* Raíz */}
        <rect
          x={8} y={upper ? 0 : 30}
          width={12} height={28}
          rx={3}
          fill={rootColor ? `${rootColor}33` : "#f1f5f9"}
          stroke={rootColor || baseStroke}
          strokeWidth="1"
        />
        {/* Corona */}
        <rect
          x={3} y={upper ? 30 : 0}
          width={22} height={28}
          rx={4}
          fill={corona ? `${corona.color}22` : ausente ? "#f1f5f9" : "#f8fafc"}
          stroke={corona?.color || (ausente ? "#9ca3af" : baseStroke)}
          strokeWidth={corona ? 1.8 : 1}
          strokeDasharray={ausente ? "3,2" : undefined}
        />
        {/* Sellante: punto verde */}
        {sellante && (
          <circle cx={14} cy={upper ? 44 : 14} r={4} fill={sellante.color} opacity={0.7} />
        )}
        {/* Implante: línea diagonal */}
        {implante && (
          <line x1={3} y1={upper ? 30 : 0} x2={25} y2={upper ? 58 : 28}
            stroke={implante.color} strokeWidth={1.5} />
        )}
        {/* Exodoncia: X roja */}
        {exodoncia && (
          <g stroke={exodoncia.color} strokeWidth={1.5}>
            <line x1={5} y1={upper ? 32 : 2} x2={23} y2={upper ? 56 : 26} />
            <line x1={23} y1={upper ? 32 : 2} x2={5} y2={upper ? 56 : 26} />
          </g>
        )}
        {/* Endodoncia: línea vertical en raíz */}
        {endodoncia && (
          <line
            x1={14} y1={upper ? 2 : 32}
            x2={14} y2={upper ? 28 : 58}
            stroke={endodoncia.color} strokeWidth={2}
          />
        )}
      </svg>

      {/* Círculo de caras (abajo para inferiores) */}
      {!upper && <FaceCircle tooth={tooth} acciones={acciones} />}

      {/* Número */}
      <span className="font-mono text-[7px] text-gray-400">{num}</span>
    </div>
  );
}

/* =========================================================
   Cuadrante
========================================================= */
function Cuadrante({ nums, upper, teeth, acciones, small }) {
  return (
    <div className="flex items-end gap-0.5 justify-center">
      {nums.map((n) => (
        <ToothMini
          key={n}
          num={n}
          upper={upper}
          tooth={teeth[n]}
          acciones={acciones}
        />
      ))}
    </div>
  );
}

/* =========================================================
   Leyenda
========================================================= */
const LEYENDA = [
  { color: "#16a34a", text: "Resina / sellante" },
  { color: "#2563eb", text: "Amalgama, coronas, endodoncia" },
  { color: "#dc2626", text: "Caries, exodoncia, resto radicular" },
  { color: "#111827", text: "Ausente, implante, ortodoncia" },
];

/* =========================================================
   Componente principal: OdontogramaResumen
========================================================= */
export default function OdontogramaResumen({ pacienteId, expedienteId }) {
  const [data, setData]         = useState(null);  // { permanente, temporal }
  const [acciones, setAcciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState("permanente");

  const cargar = useCallback(async () => {
    if (!pacienteId) return;
    try {
      setCargando(true);
      setError(null);

      const [rawOdonto, rawAcciones] = await Promise.all([
        obtenerOdontogramaPorPaciente(pacienteId, expedienteId),
        obtenerAccionesOdontograma(),
      ]);

      // apiFetch retorna Response crudo — hay que parsear el JSON manualmente
      const resOdonto   = rawOdonto   instanceof Response ? await rawOdonto.json()   : rawOdonto;
      const resAcciones = rawAcciones instanceof Response ? await rawAcciones.json() : rawAcciones;

      // resOdonto = { ok, data: { paciente, expediente_id, odontogramas: { permanente, temporal } } }
      // resAcciones = { ok, data: [...acciones] }
      setData(resOdonto?.data?.odontogramas || null);
      setAcciones(resAcciones?.data || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar el odontograma.");
    } finally {
      setCargando(false);
    }
  }, [pacienteId, expedienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /* ── Construcción del mapa teeth[numero] a partir de la respuesta ── */
  function buildTeeth(odontograma) {
    if (!odontograma?.teeth) return {};
    return odontograma.teeth;
  }

  const odontogramaPerm = data?.permanente || null;
  const odontogramaTemp = data?.temporal   || null;
  const teethPerm = buildTeeth(odontogramaPerm);
  const teethTemp = buildTeeth(odontogramaTemp);

  const hayDatos = odontogramaPerm || odontogramaTemp;

  /* ── Render ── */
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

      {/* Estado de carga */}
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
          {/* Tabs permanente / temporal */}
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

          {/* Vista permanente */}
          {(tab === "permanente" || !odontogramaTemp) && odontogramaPerm && (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Superior */}
                <div className="grid grid-cols-2 border-b-2 border-dashed border-gray-200 pb-4 mb-4">
                  <div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
                    <Cuadrante nums={SUP_DER} upper={true} teeth={teethPerm} acciones={acciones} />
                  </div>
                  <div className="flex justify-start pl-1">
                    <Cuadrante nums={SUP_IZQ} upper={true} teeth={teethPerm} acciones={acciones} />
                  </div>
                </div>
                {/* Inferior */}
                <div className="grid grid-cols-2">
                  <div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
                    <Cuadrante nums={INF_IZQ} upper={false} teeth={teethPerm} acciones={acciones} />
                  </div>
                  <div className="flex justify-start pl-1">
                    <Cuadrante nums={INF_DER} upper={false} teeth={teethPerm} acciones={acciones} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vista temporal */}
          {(tab === "temporal" || !odontogramaPerm) && odontogramaTemp && (
            <div className="overflow-x-auto">
              <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
                Dentición temporal
              </p>
              <div className="min-w-[400px]">
                <div className="grid grid-cols-2 border-b-2 border-dashed border-gray-200 pb-4 mb-4">
                  <div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
                    <Cuadrante nums={TEMP_SD} upper={true} teeth={teethTemp} acciones={acciones} small />
                  </div>
                  <div className="flex justify-start pl-1">
                    <Cuadrante nums={TEMP_SI} upper={true} teeth={teethTemp} acciones={acciones} small />
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
                    <Cuadrante nums={TEMP_II} upper={false} teeth={teethTemp} acciones={acciones} small />
                  </div>
                  <div className="flex justify-start pl-1">
                    <Cuadrante nums={TEMP_ID} upper={false} teeth={teethTemp} acciones={acciones} small />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notas generales */}
          {(odontogramaPerm?.notas_generales || odontogramaTemp?.notas_generales) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 mb-1">Notas generales</p>
              <p className="text-sm text-gray-700">
                {(tab === "permanente" ? odontogramaPerm : odontogramaTemp)?.notas_generales}
              </p>
            </div>
          )}

          {/* Leyenda */}
          <div className="mt-4 flex flex-wrap gap-3">
            {LEYENDA.map((l) => (
              <div key={l.color} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: l.color }}
                />
                <span className="text-[10px] text-gray-500">{l.text}</span>
              </div>
            ))}
          </div>

          {/* Fecha de última actualización */}
          {odontogramaPerm?.updatedAt && (
            <p className="mt-3 text-[10px] text-gray-400 text-right">
              Última actualización:{" "}
              {new Date(
                (tab === "permanente" ? odontogramaPerm : odontogramaTemp)?.updatedAt
              ).toLocaleDateString("es-CR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}