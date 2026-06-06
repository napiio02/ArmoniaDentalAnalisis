import { useState, useMemo } from "react";
import { MARCAS, USUARIOS } from "../data/mockData";
import Sidebar from "../components/Sidebar";

const ControlMarcas = () => {
  const [marcas, setMarcas] = useState(MARCAS);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formNueva, setFormNueva] = useState({
    usuario_id: "",
    fecha: new Date().toISOString().split("T")[0],
    hora_entrada: "",
    hora_salida: "",
    observaciones: "",
  });

  const calcularHoras = (entrada, salida) => {
    if (!entrada || !salida) return 0;
    const [eh, em] = entrada.split(":").map(Number);
    const [sh, sm] = salida.split(":").map(Number);
    const mins = sh * 60 + sm - (eh * 60 + em);
    return Math.round((mins / 60) * 100) / 100;
  };

  const marcasFiltradas = useMemo(() => {
    return marcas.filter((m) => {
      if (filtroFecha && m.fecha !== filtroFecha) return false;
      if (filtroUsuario && m.usuario_id._id !== filtroUsuario) return false;
      return true;
    });
  }, [marcas, filtroFecha, filtroUsuario]);

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
      resumen[id].totalHoras += m.horas_trabajadas;
      resumen[id].diasTrabajados += 1;
    });
    return Object.values(resumen);
  }, [marcas]);

  const handleGuardar = (e) => {
    e.preventDefault();
    setGuardando(true);
    const usuario = USUARIOS.find((u) => u._id === formNueva.usuario_id);
    const horas = calcularHoras(formNueva.hora_entrada, formNueva.hora_salida);
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
      };
      setMarcas((prev) => [nueva, ...prev]);
      setFormNueva({
        usuario_id: "",
        fecha: new Date().toISOString().split("T")[0],
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
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
                Control de Marcas
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Registro de entrada y salida del personal de la clínica
              </p>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Registrar Marca
            </button>
          </div>

          {/* Resumen por empleado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {resumenPorEmpleado.map((emp) => (
              <div
                key={emp.nombre}
                className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-base">
                    {emp.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#151c27] text-sm">
                      {emp.nombre}
                    </p>
                    <p className="text-[11px] text-[#3f484e]">{emp.rol}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f0f3ff] rounded-lg p-3 text-center">
                    <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-1">
                      Días
                    </p>
                    <p className="text-lg font-bold text-[#151c27]">
                      {emp.diasTrabajados}
                    </p>
                  </div>
                  <div className="bg-[#f0f3ff] rounded-lg p-3 text-center">
                    <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-1">
                      Horas
                    </p>
                    <p className="text-lg font-bold text-[#151c27]">
                      {emp.totalHoras.toFixed(1)}h
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
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

          {/* Tabla */}
          <div className="bg-white border border-[#bec8ce] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              {marcasFiltradas.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                    schedule
                  </span>
                  <p className="text-sm text-[#3f484e]">
                    No hay marcas para los filtros seleccionados
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
                        "Horas trabajadas",
                        "Observaciones",
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
                          {marca.hora_entrada}
                        </td>
                        <td className="px-5 py-4 font-mono text-sm text-[#151c27]">
                          {marca.hora_salida}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-sm font-bold ${
                              marca.horas_trabajadas >= 9
                                ? "text-[#006b5f]"
                                : marca.horas_trabajadas >= 8
                                  ? "text-[#006686]"
                                  : "text-[#855300]"
                            }`}
                          >
                            {marca.horas_trabajadas.toFixed(2)}h
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#3f484e]">
                          {marca.observaciones || "—"}
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

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#151c27]">
                Registrar Marca
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
                  Observaciones
                </label>
                <textarea
                  placeholder="Ej: Atendió emergencia, llegó tarde por..."
                  value={formNueva.observaciones}
                  onChange={(e) =>
                    setFormNueva((p) => ({
                      ...p,
                      observaciones: e.target.value,
                    }))
                  }
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
                      Registrar
                    </>
                  )}
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
