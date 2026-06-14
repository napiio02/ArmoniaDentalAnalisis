import { useEffect, useMemo, useState } from "react";
import { MARCAS, USUARIOS } from "../data/mockData";
import Sidebar from "../components/Sidebar";

const USUARIO_LOGUEADO_ID = "u1"; // Temporal: luego reemplazar por el usuario real del token/login

const hoyISO = () => new Date().toISOString().split("T")[0];

const horaActual = () =>
  new Date().toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const formatearDuracion = (ms) => {
  if (!ms || ms < 0) return "00h 00m";

  const totalMinutos = Math.floor(ms / 60000);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  return `${String(horas).padStart(2, "0")}h ${String(minutos).padStart(
    2,
    "0",
  )}m`;
};

const calcularHoras = (entrada, salida) => {
  if (!entrada || !salida) return 0;

  const [eh, em] = entrada.split(":").map(Number);
  const [sh, sm] = salida.split(":").map(Number);

  const mins = sh * 60 + sm - (eh * 60 + em);

  if (mins <= 0) return 0;

  return Math.round((mins / 60) * 100) / 100;
};

const ControlMarcas = () => {
  const usuarioLogueado = USUARIOS.find((u) => u._id === USUARIO_LOGUEADO_ID);
  const usuarioActivoId = usuarioLogueado?._id || "";

  const [marcas, setMarcas] = useState(
    MARCAS.map((m) => ({
      ...m,
      estado: m.estado || "Completa",
      tipo_registro: m.tipo_registro || "Manual",
      justificacion: m.justificacion || null,
    })),
  );

  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalJustificacion, setMostrarModalJustificacion] =
    useState(false);
  const [marcaJustificando, setMarcaJustificando] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [jornadasActivas, setJornadasActivas] = useState({});
  const [ahora, setAhora] = useState(new Date());

  const [formNueva, setFormNueva] = useState({
    usuario_id: "",
    fecha: hoyISO(),
    hora_entrada: "",
    hora_salida: "",
    observaciones: "",
  });

  const [formJustificacion, setFormJustificacion] = useState({
    tipo: "Olvidó marcar salida",
    hora_sugerida: "",
    motivo: "",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setAhora(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const jornadaActual = usuarioActivoId
    ? jornadasActivas[usuarioActivoId]
    : null;

  const tiempoActivoMs = jornadaActual
    ? ahora.getTime() - new Date(jornadaActual.inicio_at).getTime()
    : 0;

  const mostrarError = (mensaje) => {
    setError(mensaje);
    setTimeout(() => setError(""), 3500);
  };

  const iniciarJornada = () => {
    if (!usuarioLogueado) {
      mostrarError("No se pudo identificar el usuario en sesión.");
      return;
    }

    if (jornadasActivas[usuarioLogueado._id]) {
      mostrarError("Ya tienes una jornada activa.");
      return;
    }

    setJornadasActivas((prev) => ({
      ...prev,
      [usuarioLogueado._id]: {
        usuario_id: {
          _id: usuarioLogueado._id,
          nombre: usuarioLogueado.nombre,
          rol: usuarioLogueado.rol,
        },
        fecha: hoyISO(),
        inicio_at: new Date().toISOString(),
        hora_entrada: horaActual(),
      },
    }));
  };

  const finalizarJornada = () => {
    if (!usuarioLogueado || !jornadaActual) {
      mostrarError("No tienes una jornada activa.");
      return;
    }

    const ahoraFin = new Date();
    const salida = horaActual();

    const horas =
      Math.round(
        ((ahoraFin.getTime() - new Date(jornadaActual.inicio_at).getTime()) /
          3600000) *
          100,
      ) / 100;

    const nuevaMarca = {
      _id: `m${Date.now()}`,
      usuario_id: jornadaActual.usuario_id,
      fecha: jornadaActual.fecha,
      inicio_at: jornadaActual.inicio_at,
      fin_at: ahoraFin.toISOString(),
      hora_entrada: jornadaActual.hora_entrada,
      hora_salida: salida,
      horas_trabajadas: horas,
      observaciones: "Jornada registrada automáticamente.",
      estado: "Completa",
      tipo_registro: "Automático",
      justificacion: null,
    };

    setMarcas((prev) => [nuevaMarca, ...prev]);

    setJornadasActivas((prev) => {
      const copia = { ...prev };
      delete copia[usuarioLogueado._id];
      return copia;
    });
  };

  const abrirJustificacion = (marca) => {
    if (marca.usuario_id._id !== usuarioActivoId) {
      mostrarError("No puedes justificar marcas de otro usuario.");
      return;
    }

    setMarcaJustificando(marca);

    setFormJustificacion({
      tipo: !marca.hora_salida
        ? "Olvidó marcar salida"
        : "Corrección de marca",
      hora_sugerida: marca.hora_salida || "",
      motivo: "",
    });

    setMostrarModalJustificacion(true);
  };

  const guardarJustificacion = (e) => {
    e.preventDefault();

    if (!formJustificacion.motivo.trim()) {
      mostrarError("Debes indicar el motivo de la justificación.");
      return;
    }

    setMarcas((prev) =>
      prev.map((m) =>
        m._id === marcaJustificando._id
          ? {
              ...m,
              estado: "Justificada pendiente",
              justificacion: {
                tipo: formJustificacion.tipo,
                hora_sugerida: formJustificacion.hora_sugerida || "",
                motivo: formJustificacion.motivo,
                fecha: new Date().toISOString(),
              },
              observaciones: formJustificacion.motivo,
            }
          : m,
      ),
    );

    setMostrarModalJustificacion(false);
    setMarcaJustificando(null);

    setFormJustificacion({
      tipo: "Olvidó marcar salida",
      hora_sugerida: "",
      motivo: "",
    });
  };

  const marcasFiltradas = useMemo(() => {
    return marcas.filter((m) => {
      if (filtroFecha && m.fecha !== filtroFecha) return false;
      if (filtroUsuario && m.usuario_id._id !== filtroUsuario) return false;
      return true;
    });
  }, [marcas, filtroFecha, filtroUsuario]);

  const resumenGeneral = useMemo(() => {
    const hoy = hoyISO();

    const marcasHoy = marcas.filter((m) => m.fecha === hoy);
    const horasHoy = marcasHoy.reduce(
      (acc, m) => acc + (m.horas_trabajadas || 0),
      0,
    );

    return {
      enJornada: Object.keys(jornadasActivas).length,
      horasHoy,
      marcasHoy: marcasHoy.length,
      marcasManuales: marcas.filter((m) => m.tipo_registro === "Manual").length,
    };
  }, [marcas, jornadasActivas]);

  const resumenPorEmpleado = useMemo(() => {
    const resumen = {};

    marcas.forEach((m) => {
      const id = m.usuario_id._id;

      if (!resumen[id]) {
        resumen[id] = {
          nombre: m.usuario_id.nombre,
          rol: m.usuario_id.rol,
          totalHoras: 0,
          diasTrabajados: 0,
        };
      }

      resumen[id].totalHoras += m.horas_trabajadas || 0;
      resumen[id].diasTrabajados += 1;
    });

    return Object.values(resumen);
  }, [marcas]);

  const handleGuardarManual = (e) => {
    e.preventDefault();

    const usuario = USUARIOS.find((u) => u._id === formNueva.usuario_id);

    if (!usuario) {
      mostrarError("Debes seleccionar un empleado.");
      return;
    }

    const horas = calcularHoras(formNueva.hora_entrada, formNueva.hora_salida);

    if (horas <= 0) {
      mostrarError("La hora de salida debe ser mayor a la hora de entrada.");
      return;
    }

    if (!formNueva.observaciones.trim()) {
      mostrarError("Las marcas manuales requieren una observación.");
      return;
    }

    setGuardando(true);

    setTimeout(() => {
      const nueva = {
        _id: `m${Date.now()}`,
        usuario_id: {
          _id: usuario._id,
          nombre: usuario.nombre,
          rol: usuario.rol,
        },
        fecha: formNueva.fecha,
        hora_entrada: formNueva.hora_entrada,
        hora_salida: formNueva.hora_salida,
        horas_trabajadas: horas,
        observaciones: formNueva.observaciones,
        estado: "Pendiente aprobación",
        tipo_registro: "Manual",
        justificacion: {
          tipo: "Marca manual",
          hora_sugerida: "",
          motivo: formNueva.observaciones,
          fecha: new Date().toISOString(),
        },
      };

      setMarcas((prev) => [nueva, ...prev]);

      setFormNueva({
        usuario_id: "",
        fecha: hoyISO(),
        hora_entrada: "",
        hora_salida: "",
        observaciones: "",
      });

      setMostrarModal(false);
      setGuardando(false);
    }, 500);
  };

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="control-marcas" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                Control de Marcas
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Registro automático de entrada, salida y horas trabajadas.
              </p>
            </div>

            <button
              onClick={() => setMostrarModal(true)}
              className="px-6 py-2.5 bg-white border border-[#bec8ce] text-[#3f484e] rounded-full text-xs font-semibold hover:border-[#006686] hover:text-[#006686] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              Agregar marca manual
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] px-5 py-3 text-sm text-[#ba1a1a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr,1.2fr] gap-5 mb-6 items-stretch">
            <div className="bg-white border border-[#bec8ce] rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#151c27]">
                    Mi jornada
                  </h3>
                  <p className="text-xs text-[#3f484e] mt-1">
                    Marca entrada y salida del usuario en sesión.
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                    jornadaActual
                      ? "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/40"
                      : "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]"
                  }`}
                >
                  {jornadaActual ? "Activa" : "Sin jornada"}
                </span>
              </div>

              <div className="mb-4 rounded-xl border border-[#bec8ce]/60 bg-[#f9f9ff] p-4">
                <p className="text-[11px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Usuario en sesión
                </p>

                <p className="mt-1 text-sm font-bold text-[#151c27]">
                  {usuarioLogueado?.nombre || "Usuario no identificado"}
                </p>

                <p className="text-xs text-[#3f484e]">
                  {usuarioLogueado?.rol || "Sin rol"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f0f3ff] border border-[#bec8ce]/60 p-4 mb-4">
                <p className="text-[11px] font-semibold text-[#3f484e] uppercase tracking-wider">
                  Tiempo activo
                </p>

                <p className="text-3xl font-bold text-[#151c27] tracking-tight mt-1">
                  {jornadaActual
                    ? formatearDuracion(tiempoActivoMs)
                    : "00h 00m"}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-xl p-3 border border-[#bec8ce]/50">
                    <p className="text-[10px] uppercase font-semibold text-[#3f484e]">
                      Entrada
                    </p>
                    <p className="font-mono font-bold text-[#151c27]">
                      {jornadaActual?.hora_entrada || "—"}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-[#bec8ce]/50">
                    <p className="text-[10px] uppercase font-semibold text-[#3f484e]">
                      Fecha
                    </p>
                    <p className="font-bold text-[#151c27]">
                      {jornadaActual?.fecha || hoyISO()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={iniciarJornada}
                  disabled={!usuarioActivoId || Boolean(jornadaActual)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold bg-[#006686] text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    play_arrow
                  </span>
                  Iniciar
                </button>

                <button
                  type="button"
                  onClick={finalizarJornada}
                  disabled={!jornadaActual}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold bg-[#ba1a1a] text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    stop
                  </span>
                  Finalizar
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#bec8ce] rounded-2xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-[#151c27] mb-4">
                Resumen del día
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f0f3ff] p-4">
                  <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                    En jornada
                  </p>
                  <p className="text-2xl font-bold text-[#151c27] mt-1">
                    {resumenGeneral.enJornada}
                  </p>
                </div>

                <div className="rounded-xl bg-[#f0f3ff] p-4">
                  <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                    Horas hoy
                  </p>
                  <p className="text-2xl font-bold text-[#151c27] mt-1">
                    {resumenGeneral.horasHoy.toFixed(1)}h
                  </p>
                </div>

                <div className="rounded-xl bg-[#f0f3ff] p-4">
                  <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                    Marcas hoy
                  </p>
                  <p className="text-2xl font-bold text-[#151c27] mt-1">
                    {resumenGeneral.marcasHoy}
                  </p>
                </div>

                <div className="rounded-xl bg-[#f0f3ff] p-4">
                  <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">
                    Manuales
                  </p>
                  <p className="text-2xl font-bold text-[#151c27] mt-1">
                    {resumenGeneral.marcasManuales}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#bec8ce] rounded-2xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-[#151c27] mb-4">
                Resumen por empleado
              </h3>

              <div className="space-y-3">
                {resumenPorEmpleado.map((emp) => (
                  <div
                    key={emp.nombre}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[#bec8ce]/60 bg-[#f9f9ff] p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-sm flex-shrink-0">
                        {emp.nombre.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-[#151c27] text-sm truncate">
                          {emp.nombre}
                        </p>
                        <p className="text-[11px] text-[#3f484e]">
                          {emp.rol}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#151c27]">
                        {emp.totalHoras.toFixed(1)}h
                      </p>
                      <p className="text-[11px] text-[#3f484e]">
                        {emp.diasTrabajados} días
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#bec8ce] rounded-xl p-4 mb-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-[#3f484e]">
                <span className="material-symbols-outlined text-[18px]">
                  filter_list
                </span>
                <span className="text-sm font-semibold">Filtrar:</span>
              </div>

              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-3 py-2 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
              />

              <select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                className="px-3 py-2 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
              >
                <option value="">Todos los empleados</option>
                {USUARIOS.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.nombre}
                  </option>
                ))}
              </select>

              {(filtroFecha || filtroUsuario) && (
                <button
                  onClick={() => {
                    setFiltroFecha("");
                    setFiltroUsuario("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#3f484e] hover:bg-[#f0f3ff] rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#bec8ce] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              {marcasFiltradas.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                    schedule
                  </span>
                  <p className="text-sm text-[#3f484e]">
                    No hay marcas para los filtros seleccionados.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f0f3ff] border-b border-[#bec8ce]">
                      {[
                        "#",
                        "Empleado",
                        "Rol",
                        "Fecha",
                        "Entrada",
                        "Salida",
                        "Horas",
                        "Tipo",
                        "Estado",
                        "Observaciones",
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
                    {marcasFiltradas.map((marca, index) => (
                      <tr
                        key={marca._id}
                        className="hover:bg-[#e7eefe]/30 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm text-[#3f484e]">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#7dd3fc20] flex items-center justify-center text-[#006686] font-bold text-xs flex-shrink-0">
                              {marca.usuario_id.nombre.charAt(0)}
                            </div>
                            <span className="text-sm font-semibold text-[#151c27]">
                              {marca.usuario_id.nombre}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dce2f3] text-[#3f484e] border border-[#bec8ce]">
                            {marca.usuario_id.rol}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#3f484e]">
                          {new Date(
                            marca.fecha + "T12:00:00",
                          ).toLocaleDateString("es-CR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>

                        <td className="px-5 py-4 font-mono text-sm text-[#151c27]">
                          {marca.hora_entrada || "—"}
                        </td>

                        <td className="px-5 py-4 font-mono text-sm text-[#151c27]">
                          {marca.hora_salida || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-[#006686]">
                            {(marca.horas_trabajadas || 0).toFixed(2)}h
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              marca.tipo_registro === "Manual"
                                ? "bg-[#ffddb820] text-[#855300] border-[#855300]/20"
                                : "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20"
                            }`}
                          >
                            {marca.tipo_registro || "Manual"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              marca.estado === "Pendiente aprobación" ||
                              marca.estado === "Justificada pendiente"
                                ? "bg-[#ffddb820] text-[#855300] border-[#855300]/20"
                                : "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/40"
                            }`}
                          >
                            {marca.estado || "Completa"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#3f484e] max-w-[260px]">
                          {marca.observaciones || "—"}
                        </td>

                        <td className="px-5 py-4">
                          {marca.usuario_id._id === usuarioActivoId ? (
                            <button
                              type="button"
                              onClick={() => abrirJustificacion(marca)}
                              className="px-3 py-1.5 rounded-full border border-[#bec8ce] text-xs font-semibold text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-colors"
                            >
                              Justificar
                            </button>
                          ) : (
                            <span className="text-xs text-[#9ca3af]">
                              No permitido
                            </span>
                          )}
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

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#151c27]">
                  Agregar marca manual
                </h3>
                <p className="text-sm text-[#3f484e] mt-1">
                  Úsalo solo si un administrador debe registrar una jornada
                  completa.
                </p>
              </div>

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
              onSubmit={handleGuardarManual}
              autoComplete="off"
            >
              <div>
                <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                  Empleado *
                </label>

                <select
                  value={formNueva.usuario_id}
                  onChange={(e) =>
                    setFormNueva((p) => ({ ...p, usuario_id: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
                >
                  <option value="">Seleccionar empleado</option>
                  {USUARIOS.filter((u) => u.activo).map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.nombre} ({u.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                  Fecha *
                </label>

                <input
                  type="date"
                  value={formNueva.fecha}
                  onChange={(e) =>
                    setFormNueva((p) => ({ ...p, fecha: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                    Hora entrada *
                  </label>

                  <input
                    type="time"
                    value={formNueva.hora_entrada}
                    onChange={(e) =>
                      setFormNueva((p) => ({
                        ...p,
                        hora_entrada: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                    Hora salida *
                  </label>

                  <input
                    type="time"
                    value={formNueva.hora_salida}
                    onChange={(e) =>
                      setFormNueva((p) => ({
                        ...p,
                        hora_salida: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                  />
                </div>
              </div>

              {formNueva.hora_entrada && formNueva.hora_salida && (
                <div className="bg-[#7dd3fc20] border border-[#006686]/20 rounded-lg p-3 flex items-center gap-2 text-sm text-[#006686]">
                  <span className="material-symbols-outlined text-[18px]">
                    timer
                  </span>
                  Horas calculadas:{" "}
                  <strong>
                    {calcularHoras(
                      formNueva.hora_entrada,
                      formNueva.hora_salida,
                    ).toFixed(2)}{" "}
                    horas
                  </strong>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                  Justificación *
                </label>

                <textarea
                  placeholder="Ej: Se registra manualmente porque el empleado olvidó marcar la jornada completa."
                  value={formNueva.observaciones}
                  onChange={(e) =>
                    setFormNueva((p) => ({
                      ...p,
                      observaciones: e.target.value,
                    }))
                  }
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white resize-none"
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
                      Guardar solicitud
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalJustificacion && marcaJustificando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#151c27]">
                  Justificar marca
                </h3>
                <p className="text-sm text-[#3f484e] mt-1">
                  Registra el motivo por el cual esta marca necesita revisión.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarModalJustificacion(false)}
                className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="rounded-xl bg-[#f0f3ff] border border-[#bec8ce]/60 p-4 mb-5">
              <p className="text-sm font-semibold text-[#151c27]">
                {marcaJustificando.usuario_id.nombre}
              </p>
              <p className="text-xs text-[#3f484e] mt-1">
                Entrada: {marcaJustificando.hora_entrada || "—"} · Salida:{" "}
                {marcaJustificando.hora_salida || "Sin salida registrada"}
              </p>
            </div>

            <form className="space-y-4" onSubmit={guardarJustificacion}>
              <div>
                <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                  Tipo de justificación *
                </label>

                <select
                  value={formJustificacion.tipo}
                  onChange={(e) =>
                    setFormJustificacion((p) => ({
                      ...p,
                      tipo: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
                >
                  <option>Olvidó marcar entrada</option>
                  <option>Olvidó marcar salida</option>
                  <option>Corrección de marca</option>
                  <option>Problema técnico</option>
                  <option>Permiso administrativo</option>
                  <option>Atención de emergencia</option>
                  <option>Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                  Hora sugerida
                </label>

                <input
                  type="time"
                  value={formJustificacion.hora_sugerida}
                  onChange={(e) =>
                    setFormJustificacion((p) => ({
                      ...p,
                      hora_sugerida: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">
                  Motivo *
                </label>

                <textarea
                  value={formJustificacion.motivo}
                  onChange={(e) =>
                    setFormJustificacion((p) => ({
                      ...p,
                      motivo: e.target.value,
                    }))
                  }
                  placeholder="Ej: La asistente olvidó marcar salida porque estaba atendiendo una emergencia."
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalJustificacion(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                  Guardar justificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlMarcas;