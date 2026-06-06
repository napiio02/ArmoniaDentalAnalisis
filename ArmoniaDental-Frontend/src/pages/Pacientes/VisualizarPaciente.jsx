import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { PACIENTES } from "../../data/mockData";

const getInitials = (nombre = "") =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const Campo = ({ label, value, full }) => (
  <div
    className={`bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-4 ${full ? "md:col-span-2" : ""}`}
  >
    <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className="text-sm font-semibold text-[#151c27]">
      {value || "No registrado"}
    </p>
  </div>
);

const VisualizarPaciente = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setPaciente(PACIENTES.find((p) => p._id === id) || null);
    setCargando(false);
  }, [id]);

  const renderBadges = (items, color) => {
    if (!items) return <span className="text-xs text-[#bec8ce]">Ninguna</span>;
    const arr = Array.isArray(items) ? items : [items];
    if (arr.length === 0 || arr.includes("Ninguna"))
      return <span className="text-xs text-[#bec8ce]">Ninguna</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {arr.map((item) => (
          <span
            key={item}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  if (cargando)
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#006686]" />
      </div>
    );

  if (!paciente)
    return (
      <div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex flex-col">
        <header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
          <Link
            to="/pacientes"
            className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </Link>
          <span className="text-2xl">ꨄ︎</span>
          <span className="font-bold text-[#151c27]">Armonía Dental</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-6 py-4 flex items-center gap-3 text-sm text-[#ba1a1a]">
            <span className="material-symbols-outlined">error</span>
            No se encontró el paciente solicitado.
          </div>
          <button
            onClick={() => navigate("/pacientes")}
            className="flex items-center gap-2 text-sm font-semibold text-[#006686] hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Volver a pacientes
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
        <Link
          to="/pacientes"
          className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
        </Link>
        <div className="w-px h-5 bg-[#bec8ce]" />
        <span className="text-2xl">ꨄ︎</span>
        <span className="font-bold text-[#151c27]">Armonía Dental</span>
        <span className="text-[#bec8ce] mx-1">/</span>
        <Link
          to="/pacientes"
          className="text-sm text-[#3f484e] hover:text-[#006686] transition-colors"
        >
          Pacientes
        </Link>
        <span className="text-[#bec8ce] mx-1">/</span>
        <span className="text-sm font-semibold text-[#006686] truncate max-w-[200px]">
          {paciente.nombre}
        </span>
      </header>

      <div className="flex-1 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Page header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-bold text-[#151c27]">
                Detalle del Paciente
              </h2>
              <p className="text-sm text-[#3f484e] mt-1">
                Consulte la información general y clínica del paciente
              </p>
            </div>
            <Link
              to={`/pacientes/editar/${paciente._id}`}
              className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">
                edit
              </span>
              Editar
            </Link>
          </div>

          {/* Card principal */}
          <div className="bg-white border border-[#bec8ce] rounded-2xl shadow-sm overflow-hidden">
            {/* Header de la card */}
            <div className="px-8 py-6 border-b border-[#bec8ce] bg-[#f0f3ff] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#7dd3fc20] border-2 border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-xl">
                  {getInitials(paciente.nombre)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#151c27]">
                    {paciente.nombre}
                  </h3>
                  <p className="text-xs text-[#3f484e] mt-0.5">
                    Cédula: {paciente.cedula}
                  </p>
                </div>
              </div>
              {paciente.activo ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#6df5e120] text-[#006b5f] border border-[#6df5e1]/30">
                  Activo
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20">
                  Inactivo
                </span>
              )}
            </div>

            <div className="p-8 space-y-8">
              {/* Información personal */}
              <div>
                <h4 className="text-sm font-bold text-[#151c27] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#006686]">
                    person
                  </span>
                  Información personal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Campo label="Nombre completo" value={paciente.nombre} />
                  <Campo label="Cédula" value={paciente.cedula} />
                  <Campo label="Teléfono" value={paciente.telefono} />
                  <Campo label="Correo electrónico" value={paciente.email} />
                  <Campo
                    label="Fecha de nacimiento"
                    value={paciente.fecha_nacimiento}
                    full
                  />
                </div>
              </div>

              {/* Información clínica */}
              <div>
                <h4 className="text-sm font-bold text-[#151c27] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#006686]">
                    medical_information
                  </span>
                  Información clínica
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-2">
                      Alergias
                    </p>
                    {renderBadges(
                      paciente.alergias,
                      "bg-[#ffddb820] text-[#855300] border-[#855300]/20",
                    )}
                  </div>
                  <div className="bg-[#f9f9ff] border border-[#bec8ce] rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider mb-2">
                      Enfermedades relevantes
                    </p>
                    {renderBadges(
                      paciente.enfermedades,
                      "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20",
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizarPaciente;
