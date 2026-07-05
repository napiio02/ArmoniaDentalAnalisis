import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { guardarAnotaciones, descargarPdfAnotado } from "../services/documentoExpedienteService";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const COLORES = [
  { nombre: "Rojo", valor: "#ba1a1a" },
  { nombre: "Azul", valor: "#006686" },
  { nombre: "Amarillo", valor: "#f1d900" },
];

const GROSOR_LAPIZ = 3;
const RADIO_BORRADOR = 15;

const ES_IMAGEN = (formato) => ["jpg", "jpeg", "png"].includes(formato?.toLowerCase());
const ES_PDF = (formato) => formato?.toLowerCase() === "pdf";

const puntoCercano = (punto, cursor, radio) => {
  const dx = punto.x - cursor.x;
  const dy = punto.y - cursor.y;
  return Math.sqrt(dx * dx + dy * dy) < radio;
};

export default function VisorPDF({ documento, urlVer, urlDescarga, onClose, onAnotacionesGuardadas }) {
  const [numPaginas, setNumPaginas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [herramienta, setHerramienta] = useState("lapiz");
  const [colorActivo, setColorActivo] = useState(COLORES[0].valor);
  const [dimensiones, setDimensiones] = useState({ width: 0, height: 0 });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);
  const [imagenCargada, setImagenCargada] = useState(false);

  const [anotaciones, setAnotaciones] = useState(documento?.anotaciones || []);
  const [trazoActual, setTrazoActual] = useState(null);
  const dibujando = useRef(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const esImagen = ES_IMAGEN(documento?.formato);
  const esPdf = ES_PDF(documento?.formato);

  const trazosDePagina = anotaciones.filter((t) => t.pagina === paginaActual);

  // ── Redibuja el canvas ──
  const redibujarCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dibujarTrazo = (trazo) => {
      if (!trazo.puntos || trazo.puntos.length < 2) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = trazo.color;
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
    ctx.globalCompositeOperation = "source-over";
  }, [trazosDePagina, trazoActual]);

  useEffect(() => {
    redibujarCanvas();
  }, [redibujarCanvas, dimensiones]);

  const onDocumentoCargado = ({ numPages }) => setNumPaginas(numPages);

  const handlePageLoadSuccess = () => {
    const canvasOriginal = containerRef.current?.querySelector(".react-pdf__Page__canvas");
    if (canvasOriginal) {
      setDimensiones({ width: canvasOriginal.width, height: canvasOriginal.height });
    }
  };

  // ── Cuando carga la imagen, tomamos sus dimensiones ──
  const handleImagenCargada = () => {
    const img = imgRef.current;
    if (img) {
      setDimensiones({ width: img.naturalWidth, height: img.naturalHeight });
      setImagenCargada(true);
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
    if (herramienta === "lapiz") {
      const punto = obtenerCoordenadas(e);
      setTrazoActual({
        pagina: paginaActual,
        color: colorActivo,
        grosor: GROSOR_LAPIZ,
        esBorrador: false,
        puntos: [punto],
      });
    }
  };

  const handlePointerMove = (e) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const punto = obtenerCoordenadas(e);
    if (herramienta === "borrador") {
      setAnotaciones((prev) => {
        const filtradas = prev.filter(
          (trazo) =>
            trazo.pagina !== paginaActual ||
            !trazo.puntos.some((p) => puntoCercano(p, punto, RADIO_BORRADOR))
        );
        if (filtradas.length !== prev.length) setHayCambiosSinGuardar(true);
        return filtradas;
      });
    } else {
      setTrazoActual((prev) => (prev ? { ...prev, puntos: [...prev.puntos, punto] } : prev));
    }
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
      onAnotacionesGuardadas?.(documento._id, anotaciones);
      setTimeout(() => setGuardado(false), 1800);
    } catch (err) {
      alert(err.message || "No se pudieron guardar las anotaciones.");
    } finally {
      setGuardando(false);
    }
  };

  // ── Descarga con anotaciones según el formato ──
  const handleDescargar = async () => {
    setDescargando(true);
    try {
      if (esPdf) {
        // PDF: el backend genera el PDF anotado con pdf-lib
        await descargarPdfAnotado(documento._id, anotaciones, documento.nombre_original);
      } else if (esImagen) {
        // Imagen: combinamos imagen + canvas directamente en el browser
        const img = imgRef.current;
        const canvas = canvasRef.current;
        if (!img || !canvas) return;

        // Canvas temporal que combina imagen + anotaciones
        const combinado = document.createElement("canvas");
        combinado.width = canvas.width;
        combinado.height = canvas.height;
        const ctx = combinado.getContext("2d");

        // 1. Dibujar la imagen de fondo
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // 2. Dibujar el canvas de anotaciones encima
        ctx.drawImage(canvas, 0, 0);

        // 3. Exportar y disparar descarga
        const ext = documento.formato?.toLowerCase() === "png" ? "png" : "jpeg";
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";
        const nombreDescarga = documento.nombre_original.replace(
          /\.(jpg|jpeg|png)$/i,
          `_anotado.${ext}`
        );

        combinado.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = nombreDescarga;
          a.click();
          URL.revokeObjectURL(url);
        }, mimeType, 0.95);
      }
    } catch (err) {
      alert(err.message || "No se pudo descargar el archivo anotado.");
    } finally {
      setDescargando(false);
    }
  };

  const handleCerrar = () => {
    if (hayCambiosSinGuardar && !confirm("Tenés anotaciones sin guardar. ¿Cerrar de todas formas?")) return;
    onClose();
  };

  const cursorLapiz = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%23151c27'/%3E%3C/svg%3E") 0 24, crosshair`;
  const cursorBorrador = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%23151c27' stroke-width='2'/%3E%3C/svg%3E") 12 12, cell`;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex flex-col">
      {/* ── Toolbar ── */}
      <div className="bg-white border-b border-[#bec8ce] px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-[#006686]">
            {esImagen ? "image" : "picture_as_pdf"}
          </span>
          <p className="text-sm font-semibold text-[#151c27] truncate max-w-[240px]">
            {documento?.nombre_original}
          </p>
        </div>

        {/* Herramientas */}
        <div className="flex items-center gap-2">
          {COLORES.map((c) => (
            <button
              key={c.valor}
              onClick={() => { setHerramienta("lapiz"); setColorActivo(c.valor); }}
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
          <button
            onClick={handleDescargar}
            disabled={descargando}
            className="p-2 rounded-lg border border-[#bec8ce] text-[#3f484e] hover:bg-[#f0f3ff] hover:text-[#006686] transition-colors disabled:opacity-40"
            title="Descargar con anotaciones"
          >
            {descargando ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">download</span>
            )}
          </button>

          <button
            onClick={handleGuardar}
            disabled={guardando || !hayCambiosSinGuardar}
            className="px-4 py-2 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40"
          >
            {guardando ? (
              <span className="loading loading-spinner loading-xs" />
            ) : guardado ? (
              <><span className="material-symbols-outlined text-[16px]">check</span>Guardado</>
            ) : (
              <><span className="material-symbols-outlined text-[16px]">save</span>Guardar anotaciones</>
            )}
          </button>

          <button onClick={handleCerrar} className="p-2 rounded-lg hover:bg-[#f0f3ff] text-[#3f484e] transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* ── Área del documento + canvas ── */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        <div
          ref={containerRef}
          className="relative bg-white shadow-2xl"
          style={{ touchAction: "none", userSelect: "none" }}
          onDragStart={(e) => e.preventDefault()}
        >
          {/* PDF */}
          {esPdf && (
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
          )}

          {/* Imagen */}
          {esImagen && (
            <img
              ref={imgRef}
              src={urlVer}
              alt={documento?.nombre_original}
              onLoad={handleImagenCargada}
              crossOrigin="anonymous"
              className="block max-w-[80vw] max-h-[80vh] object-contain"
              draggable={false}
            />
          )}

          {/* Canvas de anotación superpuesto */}
          {dimensiones.width > 0 && (
            <canvas
              ref={canvasRef}
              width={dimensiones.width}
              height={dimensiones.height}
              className="absolute top-0 left-0"
              style={{
                width: "100%",
                height: "100%",
                zIndex: 10,
                touchAction: "none",
                userSelect: "none",
                cursor: herramienta === "borrador" ? cursorBorrador : cursorLapiz,
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

      {/* ── Navegación de páginas (solo PDF) ── */}
      {esPdf && numPaginas > 1 && (
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