import { useState } from "react";
import Navbar from "../components/Navbar";
import { PACIENTES } from "../data/mockData";
import { Save, RotateCcw } from "lucide-react";

// ??? Numeración FDI ?????????????????????????????????????????????
const SUP_DER = [18, 17, 16, 15, 14, 13, 12, 11];
const SUP_IZQ = [21, 22, 23, 24, 25, 26, 27, 28];
const INF_IZQ = [31, 32, 33, 34, 35, 36, 37, 38];
const INF_DER = [41, 42, 43, 44, 45, 46, 47, 48];
const TEMP_SD = [55, 54, 53, 52, 51];
const TEMP_SI = [61, 62, 63, 64, 65];
const TEMP_II = [71, 72, 73, 74, 75];
const TEMP_ID = [81, 82, 83, 84, 85];

// ??? Herramientas (estado / color) ??????????????????????????????
const TOOLS = [
    { id: "borrar", label: "Borrar", color: null },
    { id: "externo", label: "Externo", color: "#111827" },
    { id: "presupuesto", label: "Presupuesto", color: "#1d4ed8" },
    { id: "pendiente", label: "Pendiente", color: "#dc2626" },
    { id: "realizado", label: "Realizado", color: "#16a34a" },
];

const PROCEDURES = [
    { id: "corona", label: "Corona" },
    { id: "perno", label: "Perno" },
    { id: "rayosx", label: "Rayos X" },
    { id: "endodoncia", label: "Endodoncia" },
    { id: "implante", label: "Implante" },
    { id: "rradicular", label: "R. Radicular" },
    { id: "ausente", label: "Diente Ausente" },
    { id: "sellante", label: "Sellante" },
    { id: "brackets", label: "Brackets" },
    { id: "protesis", label: "Prótesis" },
    { id: "obturacion", label: "Obturación" },
];

// Estado limpio de un diente
const blankTooth = () => ({
    procedure: null,
    toolColor: null,
    faces: { V: null, L: null, M: null, D: null, O: null },
});

// ??? Tipo anatómico según número ????????????????????????????????
function getType(num) {
    const d = num % 10 === 0 ? 10 : num % 10;
    if (d === 8 || d === 7) return "molar3";
    if (d === 6) return "molar";
    if (d === 5 || d === 4) return "premolar";
    if (d === 3) return "canino";
    return "incisivo";
}

// ??? SVG anatómico ???????????????????????????????????????????????
// viewBox="0 0 44 88" — corona siempre en top, raíces hacia abajo.
// Para dientes inferiores hacemos flipY con transform.
function ToothSVG({ num, upper, data, onClick, small }) {
    const type = getType(num);
    const w = small ? 30 : 40;
    const h = small ? 60 : 80;

    const isAusente = data.procedure === "ausente";
    const isEndodoncia = data.procedure === "endodoncia";
    const isCrowned = data.procedure === "corona";
    const hasPerno = data.procedure === "perno";
    const hasImplante = data.procedure === "implante";
    const hasBrackets = data.procedure === "brackets";
    const hasSellante = data.procedure === "sellante";
    const hasRX = data.procedure === "rayosx";
    const hasRR = data.procedure === "rradicular";

    const tc = data.toolColor || "#9ca3af";
    const fill = isCrowned ? tc : "#e5e7eb";
    const strokeW = isCrowned ? 2 : 1.2;

    // Paths por tipo (corona arriba 0?40, raíces 40?80)
    const shapes = {
        molar3: {
            crown: "M7,40 Q6,22 9,16 L13,11 Q16,7 20,7 Q24,7 27,11 L31,16 Q34,22 33,40 Z",
            roots: [
                "M10,40 Q8,54 7,66 Q9,71 12,67 Q13,57 14,40",
                "M20,40 Q20,56 20,68 Q22,72 24,68 Q24,56 26,40",
                "M30,40 Q31,54 33,66 Q35,71 32,67 Q29,57 26,40",
            ],
        },
        molar: {
            crown: "M8,40 Q7,24 10,18 L14,13 Q17,9 20,9 Q23,9 26,13 L30,18 Q33,24 32,40 Z",
            roots: [
                "M12,40 Q10,54 9,65 Q12,70 15,65 Q15,55 16,40",
                "M24,40 Q25,55 25,65 Q28,70 31,65 Q30,54 28,40",
            ],
        },
        premolar: {
            crown: "M9,40 Q8,27 11,20 L15,14 Q17,10 20,10 Q23,10 25,14 L29,20 Q32,27 31,40 Z",
            roots: [
                "M14,40 Q13,54 12,66 Q15,71 18,66 Q18,55 18,40",
                "M22,40 Q22,55 22,66 Q25,71 28,66 Q27,54 26,40",
            ],
        },
        canino: {
            crown: "M10,40 Q9,29 12,21 L16,13 Q18,8 20,8 Q22,8 24,13 L28,21 Q31,29 30,40 Z",
            roots: ["M18,40 Q17,55 16,68 Q18,74 20,74 Q22,74 24,68 Q23,55 22,40"],
        },
        incisivo: {
            crown: "M11,40 Q10,31 13,23 L17,16 Q18,12 20,12 Q22,12 23,16 L27,23 Q30,31 29,40 Z",
            roots: ["M18,40 Q17,53 16,65 Q18,71 20,71 Q22,71 24,65 Q23,53 22,40"],
        },
    };

    const sh = shapes[type] || shapes.incisivo;

    // Flip para inferiores: espejamos verticalmente alrededor del centro (y=40)
    const gTransform = upper
        ? `scale(1)`
        : `translate(0,80) scale(1,-1)`;

    return (
        <svg
            width={w} height={h}
            viewBox="0 0 40 80"
            onClick={onClick}
            className="cursor-pointer block"
            style={{ overflow: "visible" }}
        >
            <g transform={gTransform}>
                {/* Fondo RX */}
                {hasRX && (
                    <rect x="4" y="6" width="32" height="74" rx="3"
                        fill="#bfdbfe" fillOpacity="0.5" />
                )}

                {/* Raíces */}
                {!isAusente && !hasImplante && (sh.roots || []).map((d, i) => (
                    <path key={i} d={d} fill="none"
                        stroke={isEndodoncia || hasRR ? tc : "#9ca3af"}
                        strokeWidth={isEndodoncia || hasRR ? 2.5 : 1.2}
                        strokeLinecap="round" />
                ))}

                {/* Implante: rectángulo roscado */}
                {hasImplante && (
                    <>
                        <rect x="16" y="42" width="8" height="24" rx="2"
                            fill="none" stroke={tc} strokeWidth="1.5" />
                        {[48, 54, 60].map(y => (
                            <line key={y} x1="16" y1={y} x2="24" y2={y}
                                stroke={tc} strokeWidth="1" />
                        ))}
                    </>
                )}

                {/* Corona / diente */}
                {!isAusente && (
                    <path d={sh.crown}
                        fill={fill}
                        stroke={tc}
                        strokeWidth={strokeW}
                    />
                )}

                {/* Diente ausente: X */}
                {isAusente && (
                    <>
                        <line x1="10" y1="12" x2="30" y2="68"
                            stroke={tc} strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="30" y1="12" x2="10" y2="68"
                            stroke={tc} strokeWidth="2.5" strokeLinecap="round" />
                    </>
                )}

                {/* Perno */}
                {hasPerno && (
                    <line x1="20" y1="40" x2="20" y2="66"
                        stroke={tc} strokeWidth="3" strokeLinecap="round" />
                )}

                {/* Sellante: línea sobre corona */}
                {hasSellante && (
                    <line x1="20" y1="40" x2="20" y2="16"
                        stroke={tc} strokeWidth="3.5" strokeLinecap="round" />
                )}

                {/* Brackets */}
                {hasBrackets && (
                    <>
                        <rect x="13" y="27" width="14" height="8" rx="1.5"
                            fill="none" stroke={tc} strokeWidth="1.5" />
                        <line x1="20" y1="27" x2="20" y2="35" stroke={tc} strokeWidth="1" />
                    </>
                )}

                {/* Label RX */}
                {hasRX && !upper && (
                    <text x="20" y="76" textAnchor="middle"
                        fontSize="7" fontWeight="bold" fill={tc}>RX</text>
                )}
                {hasRX && upper && (
                    <text x="20" y="76" textAnchor="middle"
                        fontSize="7" fontWeight="bold" fill={tc}>RX</text>
                )}
            </g>
        </svg>
    );
}

// ??? Círculo de obturación ???????????????????????????????????????
const CIRCLE_FACES = {
    V: "M3,3 L37,3 L27,13 L13,13 Z",
    L: "M13,27 L27,27 L37,37 L3,37 Z",
    M: "M3,3 L13,13 L13,27 L3,37 Z",
    D: "M27,13 L37,3 L37,37 L27,27 Z",
    O: "M13,13 L27,13 L27,27 L13,27 Z",
};

function ObtCircle({ num, faces, onFaceClick, small, activeToolColor, activeProc }) {
    const sz = small ? 26 : 36;
    return (
        <svg width={sz} height={sz} viewBox="0 0 40 40" className="block">
            <defs>
                <clipPath id={`cc${num}`}>
                    <circle cx="20" cy="20" r="17" />
                </clipPath>
            </defs>
            {/* Fondo */}
            <circle cx="20" cy="20" r="18" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />

            {/* Caras */}
            {Object.entries(CIRCLE_FACES).map(([face, path]) => (
                <path
                    key={face}
                    d={path}
                    fill={faces[face] || "transparent"}
                    stroke="#9ca3af"
                    strokeWidth="0.6"
                    clipPath={`url(#cc${num})`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onFaceClick(num, face);
                    }}
                    className="cursor-pointer hover:fill-gray-100"
                    style={{
                        fill: faces[face] || "transparent",
                        transition: "fill 0.1s",
                    }}
                />
            ))}

            {/* Borde exterior */}
            <circle cx="20" cy="20" r="18" fill="none" stroke="#6b7280" strokeWidth="1.3" />

            {/* Divisores */}
            <line x1="3" y1="3" x2="13" y2="13" stroke="#9ca3af" strokeWidth="0.6" />
            <line x1="37" y1="3" x2="27" y2="13" stroke="#9ca3af" strokeWidth="0.6" />
            <line x1="3" y1="37" x2="13" y2="27" stroke="#9ca3af" strokeWidth="0.6" />
            <line x1="37" y1="37" x2="27" y2="27" stroke="#9ca3af" strokeWidth="0.6" />
        </svg>
    );
}

// ??? Columna de un diente ?????????????????????????????????????????
function ToothCol({ num, upper, data, onToothClick, onFaceClick, activeToolColor, activeProc, small }) {
    return (
        <div className="flex flex-col items-center" style={{ gap: 2 }}>
            {upper && (
                <ToothSVG num={num} upper={true} data={data}
                    onClick={() => onToothClick(num)} small={small} />
            )}

            <ObtCircle num={num} faces={data.faces}
                onFaceClick={onFaceClick}
                activeToolColor={activeToolColor}
                activeProc={activeProc}
                small={small} />

            {!upper && (
                <ToothSVG num={num} upper={false} data={data}
                    onClick={() => onToothClick(num)} small={small} />
            )}

            <span className={`font-mono font-semibold text-gray-400 ${small ? "text-[8px]" : "text-[10px]"}`}>
                {num}
            </span>
        </div>
    );
}

// ??? Página principal ????????????????????????????????????????????
export default function Odontograma() {
    const [pacienteId, setPacienteId] = useState("");
    const [dentadura, setDentadura] = useState("permanente");
    const [activeTool, setActiveTool] = useState("externo");
    const [activeProc, setActiveProc] = useState(null);
    const [guardado, setGuardado] = useState(false);
    const [notas, setNotas] = useState("");

    const allNums = [
        ...SUP_DER, ...SUP_IZQ, ...INF_IZQ, ...INF_DER,
        ...TEMP_SD, ...TEMP_SI, ...TEMP_II, ...TEMP_ID,
    ];

    const [teeth, setTeeth] = useState(() =>
        Object.fromEntries(allNums.map((n) => [n, blankTooth()]))
    );

    const toolColor = TOOLS.find((t) => t.id === activeTool)?.color || null;

    // Clic en diente ? aplica procedimiento
    const handleToothClick = (num) => {
        if (!activeProc) return;
        setTeeth((prev) => {
            const t = { ...prev[num] };
            if (activeTool === "borrar" || (t.procedure === activeProc && t.toolColor === toolColor)) {
                return { ...prev, [num]: blankTooth() };
            }
            return {
                ...prev,
                [num]: { ...t, procedure: activeProc, toolColor: toolColor },
            };
        });
    };

    // Clic en cara ? obturación
    const handleFaceClick = (num, face) => {
        setTeeth((prev) => {
            const t = { ...prev[num] };
            const newFaces = { ...t.faces };
            if (activeTool === "borrar" || newFaces[face] === toolColor) {
                newFaces[face] = null;
            } else {
                newFaces[face] = toolColor || "#111827";
            }
            return { ...prev, [num]: { ...t, faces: newFaces } };
        });
    };

    const resetAll = () => {
        if (!confirm("¿Restablecer todo el odontograma?")) return;
        setTeeth(Object.fromEntries(allNums.map((n) => [n, blankTooth()])));
    };

    const isPerm = dentadura === "permanente";

    // Render de media fila (un cuadrante)
    const renderQuadrant = (nums, upper, small = false) => (
        <div className="flex items-end gap-0.5 justify-center">
            {nums.map((n) => (
                <ToothCol
                    key={n} num={n} upper={upper} data={teeth[n]}
                    onToothClick={handleToothClick}
                    onFaceClick={handleFaceClick}
                    activeToolColor={toolColor}
                    activeProc={activeProc}
                    small={small}
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />

            <div className="flex">
                {/* ?? PANEL LATERAL ?? */}
                <aside className="w-44 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen p-3 flex flex-col gap-2">

                    {/* Tipo de dentadura */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Tipo de dentadura</p>
                        {["permanente", "temporal"].map((d) => (
                            <label key={d} className="flex items-center gap-2 cursor-pointer mb-1.5">
                                <input type="radio" name="dent" value={d}
                                    checked={dentadura === d}
                                    onChange={() => setDentadura(d)}
                                    className="radio radio-xs radio-primary" />
                                <span className="text-sm capitalize">{d}</span>
                            </label>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Estado */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Estado</p>
                        {TOOLS.map((t) => (
                            <label key={t.id} className="flex items-center gap-2 cursor-pointer mb-1.5">
                                <input type="radio" name="tool" value={t.id}
                                    checked={activeTool === t.id}
                                    onChange={() => setActiveTool(t.id)}
                                    className="radio radio-xs" />
                                <span
                                    className="w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0 inline-block"
                                    style={{
                                        backgroundColor: t.id === "borrar" ? "transparent" : t.color,
                                    }}
                                />
                                <span className="text-sm">{t.label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Procedimientos */}
                    <div className="flex flex-col gap-0.5">
                        {PROCEDURES.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActiveProc(activeProc === p.id ? null : p.id)}
                                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-all ${activeProc === p.id
                                        ? "bg-sky-50 border border-sky-300 text-sky-800 font-semibold"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col gap-2">
                        <button className="btn btn-ghost btn-xs gap-1 text-gray-400 w-full" onClick={resetAll}>
                            <RotateCcw size={11} /> Restablecer
                        </button>
                        <button
                            className="btn btn-secondary btn-sm gap-1 w-full"
                            onClick={() => { setGuardado(true); setTimeout(() => setGuardado(false), 2000); }}
                        >
                            <Save size={13} />
                            {guardado ? "¡Guardado! ?" : "Guardar"}
                        </button>
                    </div>
                </aside>

                {/* ?? ÁREA ODONTOGRAMA ?? */}
                <main className="flex-1 p-4 overflow-x-auto">

                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <select
                            className="select select-bordered select-sm bg-white"
                            value={pacienteId}
                            onChange={(e) => setPacienteId(e.target.value)}
                        >
                            <option value="">— Seleccionar paciente —</option>
                            {PACIENTES.filter((p) => p.activo).map((p) => (
                                <option key={p._id} value={p._id}>{p.nombre}</option>
                            ))}
                        </select>

                        {activeProc && (
                            <span className="badge bg-sky-100 text-sky-800 border-sky-300 gap-1">
                                <span className="w-2 h-2 rounded-full inline-block"
                                    style={{ backgroundColor: toolColor || "#111827" }} />
                                {PROCEDURES.find((p) => p.id === activeProc)?.label}
                            </span>
                        )}

                        <span className="text-xs text-gray-400 ml-auto italic">
                            Clic en diente ? procedimiento · Clic en cara del círculo ? obturación
                        </span>
                    </div>

                    {/* Odontograma permanente */}
                    {isPerm && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 min-w-[780px]">
                            <div className="flex justify-end mb-1">
                                <span className="text-xs text-gray-300 font-semibold mr-1">S</span>
                            </div>

                            {/* Superior */}
                            <div className="grid grid-cols-2 border-b-2 border-dashed border-gray-200 pb-5 mb-5"
                                style={{ columnGap: 0 }}>
                                <div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
                                    {renderQuadrant(SUP_DER, true)}
                                </div>
                                <div className="flex justify-start pl-1">
                                    {renderQuadrant(SUP_IZQ, true)}
                                </div>
                            </div>

                            {/* Inferior */}
                            <div className="grid grid-cols-2" style={{ columnGap: 0 }}>
                                <div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
                                    {renderQuadrant(INF_IZQ, false)}
                                </div>
                                <div className="flex justify-start pl-1">
                                    {renderQuadrant(INF_DER, false)}
                                </div>
                            </div>

                            <div className="flex justify-end mt-1">
                                <span className="text-xs text-gray-300 font-semibold mr-1">S</span>
                            </div>
                        </div>
                    )}

                    {/* Odontograma temporal */}
                    {!isPerm && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 min-w-[500px]">
                            <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">
                                Dentición Temporal
                            </p>

                            <div className="grid grid-cols-2 border-b-2 border-dashed border-gray-200 pb-5 mb-5"
                                style={{ columnGap: 0 }}>
                                <div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
                                    {renderQuadrant(TEMP_SD, true, true)}
                                </div>
                                <div className="flex justify-start pl-1">
                                    {renderQuadrant(TEMP_SI, true, true)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2" style={{ columnGap: 0 }}>
                                <div className="flex justify-end pr-1 border-r-2 border-dashed border-gray-200">
                                    {renderQuadrant(TEMP_II, false, true)}
                                </div>
                                <div className="flex justify-start pl-1">
                                    {renderQuadrant(TEMP_ID, false, true)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notas + leyenda */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <p className="text-sm font-semibold text-gray-600 mb-2">Notas clínicas</p>
                            <textarea
                                className="textarea textarea-bordered w-full text-sm h-20 resize-none"
                                placeholder="Plan de tratamiento, observaciones del odontograma..."
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                            />
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <p className="text-sm font-semibold text-gray-600 mb-2">Leyenda de colores</p>
                            <div className="flex flex-col gap-1.5">
                                {TOOLS.filter((t) => t.id !== "borrar").map((t) => (
                                    <div key={t.id} className="flex items-center gap-2">
                                        <span
                                            className="w-5 h-5 rounded border border-gray-300 inline-block flex-shrink-0"
                                            style={{ backgroundColor: t.color }}
                                        />
                                        <span className="text-sm text-gray-600">{t.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
