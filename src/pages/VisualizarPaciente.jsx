import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";
import { PACIENTES } from "../data/mockData";
import { ArrowLeft, Pencil } from "lucide-react";
import { Link } from "react-router";

const VisualizarPaciente = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const [paciente, setPaciente] = useState(null);
	const [cargando, setCargando] = useState(true);

	useEffect(() => {
		const pacienteEncontrado = PACIENTES.find((p) => p._id === id);
		setPaciente(pacienteEncontrado || null);
		setCargando(false);
	}, [id]);

	const renderListaBadges = (items, badgeClass = "badge-warning") => {
		if (!items || (Array.isArray(items) && items.length === 0)) {
			return <span className="text-gray-400">Ninguna</span>;
		}

		if (Array.isArray(items)) {
			if (items.includes("Ninguna")) {
				return <span className="text-gray-400">Ninguna</span>;
			}

			return (
				<div className="flex flex-wrap gap-2">
					{items.map((item) => (
						<span key={item} className={`badge ${badgeClass} badge-md`}>
							{item}
						</span>
					))}
				</div>
			);
		}

		return items === "Ninguna" || items === "" ? (
			<span className="text-gray-400">Ninguna</span>
		) : (
			<span className={`badge ${badgeClass} badge-md`}>{items}</span>
		);
	};

	const getEstadoBadge = (activo) => {
		return activo ? (
			<span className="badge badge-primary">Activo</span>
		) : (
			<span className="badge badge-error">Inactivo</span>
		);
	};

	if (cargando) {
		return (
			<div>
				<Navbar />
				<div className="container mx-auto p-8 text-center">
					<span className="loading loading-spinner loading-md"></span>
					<p className="mt-2 text-gray-500">Cargando paciente...</p>
				</div>
			</div>
		);
	}

	if (!paciente) {
		return (
			<div>
				<Navbar />
				<div className="container mx-auto p-8">
					<div className="max-w-3xl mx-auto">
						<div className="alert alert-error mb-4">
							<span>No se encontró el paciente solicitado.</span>
						</div>

						<button
							className="btn btn-secondary"
							onClick={() => navigate("/pacientes")}
						>
							<ArrowLeft size={16} />
							Volver a pacientes
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8 max-w-4xl mx-auto">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
						<div>
							<h2 className="text-3xl font-bold text-gray-800 mb-2">
								Detalle del Paciente
							</h2>
							<p className="text-gray-600">
								Consulte la información general y clínica del paciente
							</p>
						</div>

						<div className="flex gap-2">
							<button
								type="button"
								className="btn btn-ghost"
								onClick={() => navigate("/pacientes")}
							>
								<ArrowLeft size={16} />
								Volver
							</button>

							<Link
								to={`/pacientes/editar/${paciente._id}`}
								className="btn btn-secondary"
							>
								<Pencil size={16} />
								Editar
							</Link>
						</div>
					</div>

					<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
						<div className="p-6 border-b border-gray-200 bg-base-100">
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
								<div>
									<h3 className="text-2xl font-semibold text-gray-800">
										{paciente.nombre}
									</h3>
									<p className="text-sm text-gray-500 mt-1">
										Cédula: {paciente.cedula}
									</p>
								</div>
								<div>{getEstadoBadge(paciente.activo)}</div>
							</div>
						</div>

						<div className="p-6 space-y-8">
							<div>
								<h4 className="text-lg font-semibold text-gray-800 mb-4">
									Información personal
								</h4>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-base-100 rounded-lg p-4 border">
										<p className="text-sm text-gray-500">Nombre completo</p>
										<p className="font-medium text-gray-800">
											{paciente.nombre || "No registrado"}
										</p>
									</div>

									<div className="bg-base-100 rounded-lg p-4 border">
										<p className="text-sm text-gray-500">Cédula</p>
										<p className="font-medium text-gray-800">
											{paciente.cedula || "No registrada"}
										</p>
									</div>

									<div className="bg-base-100 rounded-lg p-4 border">
										<p className="text-sm text-gray-500">Teléfono</p>
										<p className="font-medium text-gray-800">
											{paciente.telefono || "No registrado"}
										</p>
									</div>

									<div className="bg-base-100 rounded-lg p-4 border">
										<p className="text-sm text-gray-500">Correo electrónico</p>
										<p className="font-medium text-gray-800">
											{paciente.email || "No registrado"}
										</p>
									</div>

									<div className="bg-base-100 rounded-lg p-4 border md:col-span-2">
										<p className="text-sm text-gray-500">Fecha de nacimiento</p>
										<p className="font-medium text-gray-800">
											{paciente.fecha_nacimiento || "No registrada"}
										</p>
									</div>
								</div>
							</div>

							<div>
								<h4 className="text-lg font-semibold text-gray-800 mb-4">
									Información clínica
								</h4>

								<div className="grid grid-cols-1 gap-4">
									<div className="bg-base-100 rounded-lg p-4 border">
										<p className="text-sm text-gray-500 mb-2">Alergias</p>
										{renderListaBadges(paciente.alergias, "badge-warning")}
									</div>

									<div className="bg-base-100 rounded-lg p-4 border">
										<p className="text-sm text-gray-500 mb-2">
											Enfermedades relevantes
										</p>
										{renderListaBadges(paciente.enfermedades, "badge-info")}
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