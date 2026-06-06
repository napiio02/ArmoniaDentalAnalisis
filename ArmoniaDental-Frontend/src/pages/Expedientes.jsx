import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { PACIENTES, EXPEDIENTES } from "../data/mockData";

const getInitials = (nombre = "") =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const Expedientes = () => {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [pacientesMostrados, setPacientesMostrados] = useState(5);

  const pacientesFiltrados = PACIENTES.filter((p) => {
    const t = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(t) || p.cedula.includes(t);
  });

  const pacientesAMostrar = pacientesFiltrados.slice(0, pacientesMostrados);
  const hayMas = pacientesFiltrados.length > pacientesMostrados;

  const expedientesPaciente = pacienteSeleccionado
    ? EXPEDIENTES.filter((e) => e.paciente_id === pacienteSeleccionado._id)
    : [];

  return (
    <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
      <Sidebar activeItem="expedientes" />

      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">
              Expediente Clínico
            </h2>
            <p className="text-sm text-[#3f484e] mt-1">
              Historial médico de los pacientes de la clínica
            </p>
          </div>

          <div className="grid lg:grid-cols-7 gap-5">
            {/* ── Lista de pacientes ── */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-[#bec8ce] rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-[#151c27] flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#006686] text-[20px]">
                    stethoscope
                  </span>
                  Pacientes
                  <span className="ml-auto text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] px-2 py-0.5 rounded-full">
                    {pacientesFiltrados.length}
                  </span>
                </h3>

                {/* Buscador */}
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e] text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
                  />
                </div>

                {pacientesAMostrar.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">
                      person_search
                    </span>
                    <p className="text-sm text-[#3f484e]">
                      No se encontraron pacientes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pacientesAMostrar.map((paciente) => (
                      <button
                        key={paciente._id}
                        onClick={() => setPacienteSeleccionado(paciente)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          pacienteSeleccionado?._id === paciente._id
                            ? "bg-[#7dd3fc20] border-[#006686] border-l-4"
                            : "border-[#bec8ce] hover:bg-[#f0f3ff] hover:border-[#006686]/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-xs flex-shrink-0">
                            {getInitials(paciente.nombre)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold text-[#151c27] text-sm truncate">
                                {paciente.nombre}
                              </p>
                              {!paciente.activo && (
                                <span className="text-[10px] font-bold text-[#ba1a1a] bg-[#ffdad6] px-1.5 py-0.5 rounded-full ml-1">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#3f484e]">
                              Cédula: {paciente.cedula}
                            </p>
                            {paciente.alergias &&
                              paciente.alergias !== "Ninguna" && (
                                <p className="text-[10px] text-[#855300] font-semibold mt-0.5">
                                  ⚠{" "}
                                  {Array.isArray(paciente.alergias)
                                    ? paciente.alergias[0]
                                    : paciente.alergias}
                                </p>
                              )}
                          </div>
                        </div>
                      </button>
                    ))}

                    {hayMas && (
                      <button
                        onClick={() => setPacientesMostrados((p) => p + 5)}
                        className="w-full py-2.5 text-xs font-semibold text-[#006686] border border-[#006686]/30 rounded-xl hover:bg-[#7dd3fc20] transition-colors flex items-center justify-center gap-1 mt-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          expand_more
                        </span>
                        Ver más (
                        {pacientesFiltrados.length - pacientesMostrados}{" "}
                        restantes)
                      </button>
                    )}

                    {pacientesMostrados > 5 && !hayMas && (
                      <button
                        onClick={() => setPacientesMostrados(5)}
                        className="w-full py-2.5 text-xs font-semibold text-[#3f484e] border border-[#bec8ce] rounded-xl hover:bg-[#f0f3ff] transition-colors flex items-center justify-center gap-1 mt-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          expand_less
                        </span>
                        Ver menos
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Detalle del expediente ── */}
            <div className="lg:col-span-5">
              {pacienteSeleccionado ? (
                <div className="space-y-5">
                  {/* Info del paciente */}
                  <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#7dd3fc20] border-2 border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-lg">
                          {getInitials(pacienteSeleccionado.nombre)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-[#151c27]">
                            {pacienteSeleccionado.nombre}
                          </h3>
                          <p className="text-xs text-[#3f484e]">
                            Cédula: {pacienteSeleccionado.cedula} · Tel:{" "}
                            {pacienteSeleccionado.telefono}
                          </p>
                        </div>
                      </div>
                      {pacienteSeleccionado.activo ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#6df5e120] text-[#006b5f] border border-[#6df5e1]/30">
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        {
                          label: "Fecha de nacimiento",
                          value: new Date(
                            pacienteSeleccionado.fecha_nacimiento,
                          ).toLocaleDateString("es-CR"),
                        },
                        {
                          label: "Correo",
                          value: pacienteSeleccionado.email || "—",
                        },
                        {
                          label: "Alergias",
                          value: Array.isArray(pacienteSeleccionado.alergias)
                            ? pacienteSeleccionado.alergias.join(", ")
                            : pacienteSeleccionado.alergias,
                          warn: pacienteSeleccionado.alergias !== "Ninguna",
                        },
                        {
                          label: "Enfermedades",
                          value: Array.isArray(
                            pacienteSeleccionado.enfermedades,
                          )
                            ? pacienteSeleccionado.enfermedades.join(", ")
                            : pacienteSeleccionado.enfermedades,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-3"
                        >
                          <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-1">
                            {item.label}
                          </p>
                          <p
                            className={`text-xs font-semibold ${item.warn ? "text-[#855300]" : "text-[#151c27]"}`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Historial */}
                  <div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006686] text-[20px]">
                        history
                      </span>
                      Historial de Atenciones
                    </h3>

                    {expedientesPaciente.length === 0 ? (
                      <div className="text-center py-12">
                        <span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">
                          folder_open
                        </span>
                        <p className="text-sm text-[#3f484e]">
                          No hay registros de atenciones aún
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {expedientesPaciente.map((exp) => (
                          <div
                            key={exp._id}
                            className="border border-[#bec8ce] rounded-xl p-4 hover:shadow-sm hover:border-[#006686]/30 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#dce2f3] text-[#3f484e] border border-[#bec8ce]">
                                  {exp.tipo}
                                </span>
                                <span className="text-xs text-[#3f484e]">
                                  {new Date(exp.fecha).toLocaleDateString(
                                    "es-CR",
                                    {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                              <span className="text-xs text-[#3f484e] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  stethoscope
                                </span>
                                Dr(a). {exp.doctor}
                              </span>
                            </div>
                            <p className="text-sm text-[#151c27] mb-2">
                              {exp.descripcion}
                            </p>
                            <p className="text-sm font-semibold text-[#006686]">
                              Tratamiento: {exp.tratamiento}
                            </p>
                            {exp.proximo_control && (
                              <p className="text-xs text-[#3f484e] mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  event
                                </span>
                                Próximo control:{" "}
                                {new Date(
                                  exp.proximo_control,
                                ).toLocaleDateString("es-CR")}
                              </p>
                            )}
                            {exp.adjuntos?.length > 0 && (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                {exp.adjuntos.map((a) => (
                                  <span
                                    key={a}
                                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#bec8ce] text-[#3f484e] flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">
                                      attach_file
                                    </span>
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#bec8ce] rounded-xl p-16 text-center shadow-sm h-full flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-[#bec8ce] block mb-4">
                    stethoscope
                  </span>
                  <p className="text-base font-semibold text-[#3f484e]">
                    Seleccione un paciente para ver su expediente
                  </p>
                  <p className="text-xs text-[#bec8ce] mt-1">
                    Puede buscar por nombre o cédula en la lista de la izquierda
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Expedientes;
