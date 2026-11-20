import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import CentroNotificaciones, {
  mostrarNotificacion,
} from "../components/CentroNotificaciones";
import { obtenerPacientesConExpediente } from "../services/pacienteService";
import {
  crearComprobante,
  enviarComprobante,
  listarComprobantes,
  obtenerComprobante,
  obtenerPdfComprobante,
  subirComprobanteFirmado,
  quitarComprobanteFirmado,
  enviarWhatsappComprobante,
} from "../services/comprobanteService";

const TIPOS = ["Incapacidad", "Justificación laboral"];

const inputCls =
  "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]";
const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
    {children}
  </label>
);

const BADGE_TIPO = {
  Incapacidad: "bg-[#ffddb820] text-[#855300] border-[#855300]/20",
  "Justificación laboral": "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20",
};

const obtenerFechaActual = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Costa_Rica",
  });
};

const formatearFecha = (fecha, opciones = {}) => {
  if (!fecha) return "No indicada";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "No indicada";
  }

  return valor.toLocaleDateString("es-CR", {
    timeZone: "UTC",
    ...opciones,
  });
};

const Comprobantes = () => {
  const [comprobantes, setComprobantes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [estadoEnvio, setEstadoEnvio] = useState("idle"); // idle | sending | sent
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false);
  const [subiendoFirmado, setSubiendoFirmado] = useState(false);
  const [confirmarQuitarFirmado, setConfirmarQuitarFirmado] = useState(false);
  const inputFirmadoRef = useRef(null);

  const [formNuevo, setFormNuevo] = useState({
    paciente_id: "",
    tipo: "Incapacidad",
    fecha: obtenerFechaActual(),
    hora_inicio: "",
    hora_fin: "",
    descripcion: "",
  });

  useEffect(() => {
    let componenteActivo = true;

    const cargarDatos = async () => {
      setCargando(true);

      const [resultadoComprobantes, resultadoPacientes] =
        await Promise.allSettled([
          listarComprobantes(),
          obtenerPacientesConExpediente(),
        ]);

      if (!componenteActivo) return;

      if (resultadoComprobantes.status === "fulfilled") {
        setComprobantes(
          Array.isArray(resultadoComprobantes.value?.data)
            ? resultadoComprobantes.value.data
            : []
        );
      } else {
        setComprobantes([]);
        mostrarNotificacion({
          tipo: "error",
          titulo: "Error al cargar comprobantes",
          mensaje:
            resultadoComprobantes.reason?.message ||
            "No se pudieron cargar los comprobantes.",
        });
      }

      if (resultadoPacientes.status === "fulfilled") {
        setPacientes(
          Array.isArray(resultadoPacientes.value?.data)
            ? resultadoPacientes.value.data
            : []
        );
      } else {
        setPacientes([]);
        mostrarNotificacion({
          tipo: "error",
          titulo: "Error al cargar pacientes",
          mensaje:
            resultadoPacientes.reason?.message ||
            "No se pudieron cargar los pacientes.",
        });
      }

      setCargando(false);
    };

    cargarDatos();

    return () => {
      componenteActivo = false;
    };
  }, []);

  const filtrados = comprobantes.filter((c) => {
    const term = busqueda.trim().toLocaleLowerCase("es");
    const nombrePaciente = c.paciente_nombre || "";
    const numero = c.numero || "";
    const match =
      nombrePaciente.toLocaleLowerCase("es").includes(term) ||
      numero.toLocaleLowerCase("es").includes(term);
    return match && (tipoFiltro ? c.tipo === tipoFiltro : true);
  });

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const resultado = await crearComprobante(formNuevo);

      setComprobantes((previos) => [
        resultado.data,
        ...previos,
      ]);
      setFormNuevo({
        paciente_id: "",
        tipo: "Incapacidad",
        fecha: obtenerFechaActual(),
        hora_inicio: "",
        hora_fin: "",
        descripcion: "",
      });
      setMostrarModal(false);
    } catch (error) {
      mostrarNotificacion({
        tipo: "error",
        titulo: "No se pudo crear el comprobante",
        mensaje: error.message || "Inténtalo nuevamente.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleEnviar = async () => {
    if (estadoEnvio === "sending") return;
    
    if (!tieneCorreo(mostrarDetalle)) {
      mostrarNotificacion({
        tipo: "error",
        titulo: "No se pudo enviar el comprobante",
        mensaje:
        "El paciente no tiene un correo registrado. Puedes imprimir o guardar el comprobante como PDF.",
      });
      return; // no se marca como enviado
    }

    setEstadoEnvio("sending");
    
    try {
      const resultado = await enviarComprobante(
        mostrarDetalle._id
      );
      const actualizado = resultado.data;

      setMostrarDetalle(actualizado);
      setComprobantes((previos) =>
        previos.map((comprobante) =>
          comprobante._id === actualizado._id
            ? actualizado
            : comprobante
        )
      );
      setEstadoEnvio("sent");
    } catch (error) {
      setEstadoEnvio("idle");
      mostrarNotificacion({
        tipo: "error",
        titulo: "No se pudo enviar el comprobante",
        mensaje: error.message || "Inténtalo nuevamente.",
      });
    }
  };

  // Abre el PDF oficial (el mismo que se envía por correo) para imprimirlo o guardarlo.
  // La ventana se abre antes de la descarga para que el navegador no la bloquee.
  const imprimirComprobante = async (comp, version = comp.firmado ? "firmado" : "generado") => {
    const ventana = window.open("", "_blank");
    if (ventana) {
      ventana.document.title = `Comprobante ${comp.numero}`;
      ventana.document.body.innerHTML =
        '<p style="font-family:Arial,sans-serif;padding:32px;color:#3f484e">Generando comprobante...</p>';
    }
    try {
      const url = URL.createObjectURL(await obtenerPdfComprobante(comp._id, version));
      if (ventana && !ventana.closed) {
        ventana.location.href = url;
      } else {
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = `${comp.numero}${version === "firmado" ? "-firmado" : ""}.pdf`;
        enlace.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      ventana?.close();
      mostrarNotificacion({
        tipo: "error",
        titulo: "No se pudo abrir el comprobante",
        mensaje: err.message,
      });
    }
  };

  const actualizarComprobante = (actualizado) => {
    setMostrarDetalle(actualizado);
    setComprobantes((previos) => previos.map((c) => (c._id === actualizado._id ? actualizado : c)));
  };

  const handleSubirFirmado = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo || !mostrarDetalle) return;
    if (archivo.type && archivo.type !== "application/pdf") {
      mostrarNotificacion({ tipo: "error", titulo: "Archivo no válido", mensaje: "Seleccione el comprobante firmado en formato PDF." });
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      mostrarNotificacion({ tipo: "error", titulo: "Archivo muy grande", mensaje: "El PDF firmado no puede superar 5 MB." });
      return;
    }
    setSubiendoFirmado(true);
    try {
      const resultado = await subirComprobanteFirmado(mostrarDetalle._id, archivo);
      actualizarComprobante(resultado.data);
      mostrarNotificacion({ tipo: "success", titulo: "Comprobante firmado guardado", mensaje: "Los envíos usarán la versión firmada." });
    } catch (error) {
      mostrarNotificacion({ tipo: "error", titulo: "No se pudo subir el comprobante firmado", mensaje: error.message });
    } finally {
      setSubiendoFirmado(false);
    }
  };

  const handleQuitarFirmado = async () => {
    setConfirmarQuitarFirmado(false);
    try {
      const resultado = await quitarComprobanteFirmado(mostrarDetalle._id);
      actualizarComprobante(resultado.data);
      mostrarNotificacion({ tipo: "success", titulo: "Se quitó la versión firmada", mensaje: "Puede subir otra cuando quiera." });
    } catch (error) {
      mostrarNotificacion({ tipo: "error", titulo: "No se pudo quitar la versión firmada", mensaje: error.message });
    }
  };

  const handleEnviarWhatsapp = async () => {
    if (enviandoWhatsapp || !mostrarDetalle) return;
    setEnviandoWhatsapp(true);
    try {
      const resultado = await enviarWhatsappComprobante(mostrarDetalle._id);
      actualizarComprobante(resultado.data);
      mostrarNotificacion({
        tipo: "success",
        titulo: "Comprobante enviado por WhatsApp",
        mensaje: `Se envió la versión ${resultado.data.whatsapp_version_enviada === "firmado" ? "firmada" : "sin firma"} al ${resultado.data.whatsapp_enviado_a}.`,
      });
    } catch (error) {
      mostrarNotificacion({ tipo: "error", titulo: "No se pudo enviar por WhatsApp", mensaje: error.message });
    } finally {
      setEnviandoWhatsapp(false);
    }
  };

  const handleVerDetalle = async (comprobante) => {
    setMostrarDetalle(comprobante);
    setEstadoEnvio(
      comprobante.estado_envio === "enviado" ? "sent" : "idle"
    );

    try {
      const resultado = await obtenerComprobante(
        comprobante._id
      );

      setMostrarDetalle(resultado.data);
      setEstadoEnvio(
        resultado.data.estado_envio === "enviado"
          ? "sent"
          : "idle"
      );
    } catch (error) {
      mostrarNotificacion({
        tipo: "error",
        titulo: "No se pudo cargar el detalle",
        mensaje:
          error.message ||
          "No se pudo obtener el detalle del comprobante.",
      });
    }
  };

  const obtenerCorreoValido = (comp) => {
    const pacienteId = comp?.paciente_id?._id || comp?.paciente_id;
    const paciente = pacientes.find((p) => p._id === pacienteId);

    const candidato =
      comp?.correo_destino ||
      comp?.enviado_a ||
      paciente?.correo ||
      "";

    return typeof candidato === "string" ? candidato.trim() : "";
  };

  const tieneCorreo = (comp) => Boolean(obtenerCorreoValido(comp));
  const getCorreo = (comp) => obtenerCorreoValido(comp) || "No indicado";

  return (
    <div className="flex overflow-hidden h-dvh bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <CentroNotificaciones />
      <Sidebar activeItem="comprobantes" />

      <main className="flex-1 h-dvh overflow-y-auto px-4 pt-20 pb-10 sm:px-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                Comprobantes Médicos
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Generación y gestión de documentos médicos digitales
              </p>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo Comprobante
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white border border-[#bec8ce] rounded-xl p-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar por paciente o número de comprobante..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                />
              </div>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
              >
                <option value="">Todos los tipos</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white border border-[#bec8ce] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {filtrados.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                    description
                  </span>
                  <p className="text-sm text-[#3f484e]">
                    {cargando
                      ? "Cargando comprobantes..."
                      : "No se encontraron comprobantes"}
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[760px] whitespace-nowrap text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f0f3ff] border-b border-[#bec8ce]">
                      {[
                        "Número",
                        "Paciente",
                        "Tipo",
                        "Fecha",
                        "Horario",
                        "Doctor(a)",
                        "Acciones",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#bec8ce]/40">
                    {filtrados.map((comp) => (
                      <tr
                        key={comp._id}
                        className="hover:bg-[#e7eefe]/30 transition-colors"
                      >
                        <td className="px-5 py-4 font-mono text-sm font-semibold text-[#151c27]">
                          {comp.numero}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#151c27]">
                          {comp.paciente_nombre}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${BADGE_TIPO[comp.tipo] || "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]"}`}
                          >
                            {comp.tipo}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#3f484e]">
                          {formatearFecha(comp.fecha, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4 font-mono text-sm text-[#3f484e]">
                          {comp.hora_inicio} – {comp.hora_fin}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#3f484e]">
                          {comp.profesional_nombre}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleVerDetalle(comp)}
                            aria-label="Ver"
                            data-testid={`ver-comprobante-${comp._id}`}
                            title="Ver"
                            className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal nuevo comprobante ── */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#151c27]">
                Nuevo Comprobante
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={handleGuardar}
              autoComplete="off"
            >
              <div>
                <Label>Paciente *</Label>
                <select
                  value={formNuevo.paciente_id}
                  onChange={(e) =>
                    setFormNuevo((p) => ({ ...p, paciente_id: e.target.value }))
                  }
                  required
                  className={inputCls}
                >
                  <option value="">Seleccionar paciente</option>
                  {pacientes.filter((p) => p.activo !== false).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo *</Label>
                  <select
                    value={formNuevo.tipo}
                    onChange={(e) =>
                      setFormNuevo((p) => ({ ...p, tipo: e.target.value }))
                    }
                    className={inputCls}
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Fecha *</Label>
                  <input
                    type="date"
                    value={formNuevo.fecha}
                    onChange={(e) =>
                      setFormNuevo((p) => ({ ...p, fecha: e.target.value }))
                    }
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora inicio</Label>
                  <input
                    type="time"
                    value={formNuevo.hora_inicio}
                    onChange={(e) =>
                      setFormNuevo((p) => ({
                        ...p,
                        hora_inicio: e.target.value,
                      }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>Hora fin</Label>
                  <input
                    type="time"
                    value={formNuevo.hora_fin}
                    onChange={(e) =>
                      setFormNuevo((p) => ({ ...p, hora_fin: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <Label>Descripción *</Label>
                <textarea
                  value={formNuevo.descripcion}
                  onChange={(e) =>
                    setFormNuevo((p) => ({ ...p, descripcion: e.target.value }))
                  }
                  placeholder="Describa el procedimiento realizado"
                  required
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                      Generar Comprobante
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal detalle ── */}
      {mostrarDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-3 sm:mx-4 p-5 sm:p-6 max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#151c27]">
                Comprobante {mostrarDetalle.numero}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMostrarDetalle(null);
                  setEstadoEnvio("idle");
                }}
                className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Vista del documento */}
            <div className="border border-[#bec8ce] rounded-xl p-5 space-y-3 mb-4">
              <div className="flex items-center justify-between gap-3 border-b-2 border-[#2a4d84] pb-3 mb-2">
                <img src="/logo-armonia-dental.png" alt="Armonía Dental" className="h-14 w-auto" />
                <div className="text-right">
                  <p className="text-sm font-bold text-[#2a4d84] tracking-wide">ARMONÍA DENTAL</p>
                  <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">Comprobante médico</p>
                  <p className="text-[11px] text-[#3f484e]">Tel. 6111-9106 · lau_ure@icloud.com</p>
                </div>
              </div>

              {[
                {
                  label: "Número",
                  value: (
                    <span className="font-mono font-semibold text-sm">
                      {mostrarDetalle.numero}
                    </span>
                  ),
                },
                {
                  label: "Tipo",
                  value: (
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${BADGE_TIPO[mostrarDetalle.tipo] || "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]"}`}
                    >
                      {mostrarDetalle.tipo}
                    </span>
                  ),
                },
                {
                  label: "Paciente",
                  value: mostrarDetalle.paciente_nombre,
                },
                {
                  label: "Correo",
                  value: (
                    <span className="break-all text-right">
                      {getCorreo(mostrarDetalle)}
                    </span>
                  ),
                },
                {
                  label: "Fecha",
                  value: formatearFecha(mostrarDetalle.fecha),
                },
                {
                  label: "Horario",
                  value: (
                    <span className="font-mono">
                      {mostrarDetalle.hora_inicio} – {mostrarDetalle.hora_fin}
                    </span>
                  ),
                },
                {
                  label: "Doctor(a)",
                  value: mostrarDetalle.profesional_nombre,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center gap-4"
                >
                  <span className="text-xs text-[#3f484e] shrink-0">
                    {row.label}:
                  </span>
                  <span className="text-sm font-semibold text-[#151c27] text-right">
                    {row.value}
                  </span>
                </div>
              ))}

              <div>
                <p className="text-xs text-[#3f484e] mb-1.5">Descripción:</p>
                <p className="text-sm bg-[#f0f3ff] rounded-lg p-3 text-[#151c27]">
                  {mostrarDetalle.descripcion}
                </p>
              </div>
            </div>

            {/* Firma digital */}
            <input ref={inputFirmadoRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleSubirFirmado} />
            {mostrarDetalle.firmado ? (
              <div className="rounded-xl border border-[#6df5e1]/40 bg-[#6df5e120] px-4 py-3 mb-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006b5f]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#151c27]">Firmado digitalmente</p>
                    <p className="text-xs text-[#3f484e]">
                      Subido{mostrarDetalle.firmado.subido_por_nombre ? ` por ${mostrarDetalle.firmado.subido_por_nombre}` : ""}
                      {mostrarDetalle.firmado.subido_en ? ` el ${new Date(mostrarDetalle.firmado.subido_en).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                      <br />Los envíos por correo y WhatsApp usan esta versión.
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs font-semibold">
                      <button type="button" onClick={() => imprimirComprobante(mostrarDetalle, "firmado")} className="text-[#006686] hover:underline">Ver firmado</button>
                      <button type="button" onClick={() => inputFirmadoRef.current?.click()} disabled={subiendoFirmado} className="text-[#006686] hover:underline disabled:opacity-50">
                        {subiendoFirmado ? "Subiendo..." : "Reemplazar"}
                      </button>
                      <button type="button" onClick={() => setConfirmarQuitarFirmado(true)} className="text-[#ba1a1a] hover:underline">Quitar</button>
                    </div>
                    {confirmarQuitarFirmado && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[#3f484e]">¿Quitar la versión firmada?</span>
                        <button type="button" onClick={handleQuitarFirmado} className="px-3 py-1 rounded-full bg-[#ba1a1a] text-white font-semibold">Sí, quitar</button>
                        <button type="button" onClick={() => setConfirmarQuitarFirmado(false)} className="px-3 py-1 rounded-full border border-[#bec8ce] text-[#3f484e] font-semibold">No</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#bec8ce] bg-[#f9f9ff] px-4 py-3 mb-4">
                <p className="text-sm font-semibold text-[#151c27] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#006686]">draw</span>
                  Firma digital (opcional)
                </p>
                <ol className="mt-2 space-y-1.5 text-xs text-[#3f484e] list-decimal pl-5">
                  <li>
                    <button type="button" onClick={() => imprimirComprobante(mostrarDetalle, "generado")} className="font-semibold text-[#006686] hover:underline">
                      Descargue el PDF
                    </button>{" "}del comprobante.
                  </li>
                  <li>Fírmelo en su computadora con su firma digital.</li>
                  <li>
                    <button type="button" onClick={() => inputFirmadoRef.current?.click()} disabled={subiendoFirmado} className="font-semibold text-[#006686] hover:underline disabled:opacity-50">
                      {subiendoFirmado ? "Subiendo..." : "Suba el PDF firmado"}
                    </button>
                    . Desde ese momento, el correo y WhatsApp enviarán la versión firmada.
                  </li>
                </ol>
              </div>
            )}

            {mostrarDetalle.estado_whatsapp === "enviado" && (
              <p className="text-xs text-[#006b5f] mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">chat</span>
                Enviado por WhatsApp al {mostrarDetalle.whatsapp_enviado_a}
                {mostrarDetalle.whatsapp_enviado_en ? ` el ${new Date(mostrarDetalle.whatsapp_enviado_en).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                {mostrarDetalle.whatsapp_version_enviada === "firmado" ? " (versión firmada)" : ""}
              </p>
            )}

            {!tieneCorreo(mostrarDetalle) && estadoEnvio === "idle" && (
              <div className="rounded-xl border border-[#855300]/20 bg-[#ffddb820] px-4 py-3 mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#855300]">warning</span>
                <p className="text-xs text-[#3f484e]">
                  Este paciente no tiene correo registrado. Puedes imprimir o guardar el
                  comprobante como PDF para entregárselo.
                </p>
              </div>
            )}

            {/* Estado envío */}
            {estadoEnvio !== "idle" && (
              <div
                className={`rounded-xl border px-4 py-3 mb-4 flex items-center gap-3 transition-all ${
                  estadoEnvio === "sending"
                    ? "border-[#006686]/20 bg-[#7dd3fc20]"
                    : "border-[#6df5e1]/30 bg-[#6df5e120]"
                }`}
              >
                {estadoEnvio === "sending" ? (
                  <span className="loading loading-spinner loading-sm text-[#006686]" />
                ) : (
                  <span
                    className="material-symbols-outlined text-[#006b5f]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#151c27]">
                    {estadoEnvio === "sending"
                      ? "Enviando..."
                      : "Comprobante enviado al correo del cliente"}
                  </p>
                  <p className="text-xs text-[#3f484e]">
                    {getCorreo(mostrarDetalle)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setMostrarDetalle(null);
                  setEstadoEnvio("idle");
                  setConfirmarQuitarFirmado(false);
                }}
                className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
              >
                Cerrar
              </button>

              <button
                onClick={() => imprimirComprobante(mostrarDetalle)}
                className="px-5 py-2.5 text-xs font-semibold text-[#006686] bg-white border border-[#006686] rounded-full hover:bg-[#f0f3ff] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Imprimir / PDF
              </button>

              <button
                onClick={handleEnviarWhatsapp}
                disabled={enviandoWhatsapp}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1f9d55] rounded-full hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
              >
                {enviandoWhatsapp ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                )}
                {enviandoWhatsapp ? "Enviando..." : "Enviar por WhatsApp"}
              </button>

              <button
                onClick={handleEnviar}
                disabled={estadoEnvio === "sending"}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-60 ${
                  estadoEnvio === "sent"
                    ? "bg-[#006b5f] text-white"
                    : "bg-[#006686] text-white hover:opacity-90"
                }`}
              >
                {estadoEnvio === "sending" ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Enviando...
                  </>
                ) : estadoEnvio === "sent" ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">
                      check_circle
                    </span>
                    Enviado
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">
                      send
                    </span>
                    Enviar por correo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comprobantes;
