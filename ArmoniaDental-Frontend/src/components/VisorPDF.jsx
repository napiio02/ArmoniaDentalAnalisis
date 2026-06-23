import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { guardarAnotaciones } from "../services/documentoExpedienteService";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const COLORES = [
  { nombre: "Rojo", valor: "#ba1a1a" },
  { nombre: "Azul", valor: "#006686" },
  { nombre: "Amarillo", valor: "#f1d900" },
];

const GROSOR_LAPIZ = 3;
const GROSOR_BORRADOR = 18;

export default function VisorPDF({ documento, urlVer, urlDescarga, onClose }) {
  const [numPaginas, setNumPaginas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [herramienta, setHerramienta] = useState("lapiz"); // "lapiz" | "borrador"
  const [colorActivo, setColorActivo] = useState(COLORES[0].valor);
  const [dimensiones, setDimensiones] = useState({ width: 0, height: 0 });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  // Anotaciones: array de trazos { pagina, color, grosor, esBorrador, puntos: [{x,y}] }
  const [anotaciones, setAnotaciones] = useState(documento?.anotaciones || []);
  const [trazoActual, setTrazoActual] = useState(null);
  const dibujando = useRef(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const trazosDePagina = anotaciones.filter((t) => t.pagina === paginaActual);

  // ── Redibuja todo el canvas según los trazos guardados + el trazo en curso ──
  const redibujarCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dibujarTrazo = (trazo) => {
      if (!trazo.puntos || trazo.puntos.length < 2) return;

      ctx.globalCompositeOperation = trazo.esBorrador ? "destination-out" : "source-over";
      ctx.strokeStyle = trazo.esBorrador ? "rgba(0,0,0,1)" : trazo.color;
      ctx.lineWidth = trazo.grosor || GROSOR_LAPIZ;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(trazo.puntos[0].x, trazo.puntos[0].y);
      trazo.puntos.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    };

    trazosDePagina.forEach(dibujarTrazo);
    if (trazoActual) dibujarTrazo(trazoActual);

    ctx.globalCompositeOperation = "source-over"; // resetear al final
  }, [trazosDePagina, trazoActual]);

  useEffect(() => {
    redibujarCanvas();
  }, [redibujarCanvas, dimensiones]);

  const onDocumentoCargado = ({ numPages }) => setNumPaginas(numPages);

  // Captura el tamaño real renderizado del <canvas> de react-pdf para igualar el nuestro
  const handlePageLoadSuccess = () => {
    const canvasOriginal = containerRef.current?.querySelector(".react-pdf__Page__canvas");
    if (canvasOriginal) {
      setDimensiones({
        width: canvasOriginal.width,
        height: canvasOriginal.height,
      });
    }
  };

  const obtenerCoordenadas = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    dibujando.current = true;
    const punto = obtenerCoordenadas(e);
    setTrazoActual({
      pagina: paginaActual,
      color: colorActivo,
      grosor: herramienta === "borrador" ? GROSOR_BORRADOR : GROSOR_LAPIZ,
      esBorrador: herramienta === "borrador",
      puntos: [punto],
    });
  };

  const handlePointerMove = (e) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const punto = obtenerCoordenadas(e);
    setTrazoActual((prev) => (prev ? { ...prev, puntos: [...prev.puntos, punto] } : prev));
  };

  const handlePointerUp = () => {
    if (!dibujando.current) return;
    dibujando.current = false;
    if (trazoActual && trazoActual.puntos.length > 1) {
      setAnotaciones((prev) => [...prev, trazoActual]);
      setHayCambiosSinGuardar(true);
    }
    setTrazoActual(null);
  };

  const limpiarPaginaActual = () => {
    if (!confirm("¿Limpiar todas las anotaciones de esta página?")) return;
    setAnotaciones((prev) => prev.filter((t) => t.pagina !== paginaActual));
    setHayCambiosSinGuardar(true);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await guardarAnotaciones(documento._id, anotaciones);
      setHayCambiosSinGuardar(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1800);
    } catch (err) {
      alert(err.message || "No se pudieron guardar las anotaciones.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrar = () => {
    if (hayCambiosSinGuardar && !confirm("Tenés anotaciones sin guardar. ¿Cerrar de todas formas?")) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex flex-col">
      {/* ── Toolbar superior ── */}
      <div className="bg-white border-b border-[#bec8ce] px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-[#006686]">picture_as_pdf</span>
          <p className="text-sm font-semibold text-[#151c27] truncate max-w-[240px]">
            {documento?.nombre_original}
          </p>
        </div>

        {/* Herramientas de dibujo */}
        <div className="flex items-center gap-2">
          {COLORES.map((c) => (
            <button
              key={c.valor}
              onClick={() => {
                setHerramienta("lapiz");
                setColorActivo(c.valor);
              }}
              title={c.nombre}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                herramienta === "lapiz" && colorActivo === c.valor
                  ? "border-[#151c27] scale-110"
                  : "border-[#bec8ce]"
              }`}
              style={{ backgroundColor: c.valor }}
            />
          ))}

          <div className="w-px h-6 bg-[#bec8ce] mx-1" />

          <button
            onClick={() => setHerramienta("borrador")}
            title="Borrador"
            className={`p-2 rounded-lg border transition-colors ${
              herramienta === "borrador"
                ? "bg-[#7dd3fc20] border-[#006686] text-[#006686]"
                : "border-[#bec8ce] text-[#3f484e] hover:bg-[#f0f3ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">ink_eraser</span>
          </button>

          <button
            onClick={limpiarPaginaActual}
            title="Limpiar página"
            className="p-2 rounded-lg border border-[#bec8ce] text-[#3f484e] hover:bg-[#ffdad6]/30 hover:text-[#ba1a1a] hover:border-[#ba1a1a]/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <a
            href={urlDescarga}
            className="p-2 rounded-lg border border-[#bec8ce] text-[#3f484e] hover:bg-[#f0f3ff] hover:text-[#006686] transition-colors"
            title="Descargar original"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
          </a>

          <button
            onClick={handleGuardar}
            disabled={guardando || !hayCambiosSinGuardar}
            className="px-4 py-2 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40"
          >
            {guardando ? (
              <span className="loading loading-spinner loading-xs" />
            ) : guardado ? (
              <>
                <span className="material-symbols-outlined text-[16px]">check</span>
                Guardado
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                Guardar anotaciones
              </>
            )}
          </button>

          <button onClick={handleCerrar} className="p-2 rounded-lg hover:bg-[#f0f3ff] text-[#3f484e] transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* ── Área del PDF + canvas ── */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        <div
          ref={containerRef}
          className="relative bg-white shadow-2xl"
          style={{ touchAction: "none", userSelect: "none" }}
          onDragStart={(e) => e.preventDefault()}
        >
          <Document
            file={urlVer}
            onLoadSuccess={onDocumentoCargado}
            loading={
              <div className="flex items-center justify-center w-[600px] h-[800px]">
                <span className="loading loading-spinner loading-lg text-[#006686]" />
              </div>
            }
            error={
              <div className="flex items-center justify-center w-[600px] h-[400px] text-[#ba1a1a] text-sm">
                No se pudo cargar el documento.
              </div>
            }
          >
            <Page
              pageNumber={paginaActual}
              onRenderSuccess={handlePageLoadSuccess}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>

          {/* Canvas de anotación superpuesto */}
          {dimensiones.width > 0 && (
            <canvas
              ref={canvasRef}
              width={dimensiones.width}
              height={dimensiones.height}
              className="absolute top-0 left-0 cursor-crosshair"
              style={{
                width: "100%",
                height: "100%",
                zIndex: 10,
                touchAction: "none",
                userSelect: "none",
              }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onDragStart={(e) => e.preventDefault()}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
          )}
        </div>
      </div>

      {/* ── Navegación de páginas ── */}
      {numPaginas > 1 && (
        <div className="bg-white border-t border-[#bec8ce] px-6 py-3 flex items-center justify-center gap-4">
          <button
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="p-1.5 rounded hover:bg-[#f0f3ff] transition-colors disabled:opacity-30 text-[#3f484e]"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-sm font-semibold text-[#151c27]">
            Página {paginaActual} de {numPaginas}
          </span>
          <button
            onClick={() => setPaginaActual((p) => Math.min(numPaginas, p + 1))}
            disabled={paginaActual === numPaginas}
            className="p-1.5 rounded hover:bg-[#f0f3ff] transition-colors disabled:opacity-30 text-[#3f484e]"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}