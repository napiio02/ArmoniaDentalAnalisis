import { useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { Pencil } from "lucide-react";

const EditarPaciente = () => {
	const navigate = useNavigate();

	// Añadir toda lógica cuando lo encuentre remplazar los strings vacíos por la información de la API
	const [formData, setFormData] = useState({
		nombre: "",
		cedula: "",
		telefono: "",
		email: "",
		fecha_nacimiento: "",
		alergias: [],
		enfermedades: [],
	});

	const alergiasDisponibles = [
		"Penicilina",
		"Látex",
		"Anestesia",
		"Ibuprofeno",
		"Amoxicilina",
		"Polen",
		"Mariscos",
		"Ninguna",
	];

	const enfermedadesDisponibles = [
		"Diabetes",
		"Hipertensión",
		"Asma",
		"Enfermedad cardíaca",
		"Epilepsia",
		"Artritis",
		"Tiroides",
		"Ninguna",
	];

	const [guardando, setGuardando] = useState(false);
	const [exito, setExito] = useState(false);
	const [alergiaSeleccionada, setAlergiaSeleccionada] = useState("");
	const [enfermedadSeleccionada, setEnfermedadSeleccionada] = useState("");

	const agregarAlergia = (alergia) => {
		if (!alergia) return;

		setFormData((prev) => {
			if (alergia === "Ninguna") {
				return { ...prev, alergias: ["Ninguna"] };
			}

			const alergiasActuales = prev.alergias.filter((a) => a !== "Ninguna");

			if (alergiasActuales.includes(alergia)) return prev;

			return {
				...prev,
				alergias: [...alergiasActuales, alergia],
			};
		});
	};

	const eliminarAlergia = (alergia) => {
		setFormData((prev) => ({
			...prev,
			alergias: prev.alergias.filter((a) => a !== alergia),
		}));
	};

	const agregarEnfermedad = (enfermedad) => {
		if (!enfermedad) return;

		setFormData((prev) => {
			if (enfermedad === "Ninguna") {
				return { ...prev, enfermedades: ["Ninguna"] };
			}

			const actuales = prev.enfermedades.filter((e) => e !== "Ninguna");

			if (actuales.includes(enfermedad)) return prev;

			return {
				...prev,
				enfermedades: [...actuales, enfermedad],
			};
		});
	};

	const eliminarEnfermedad = (enfermedad) => {
		setFormData((prev) => ({
			...prev,
			enfermedades: prev.enfermedades.filter((e) => e !== enfermedad),
		}));
	};

	const onChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		setGuardando(true);

		setTimeout(() => {
			setGuardando(false);
			setExito(true);

			setTimeout(() => {
				navigate("/pacientes");
			}, 1500);
		}, 800);
	};

	return (
		<div>
			<Navbar />

			<div className="container mx-auto p-8">
				<div className="lg:px-8 max-w-2xl mx-auto">
					<h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Paciente</h2>
					<p className="text-gray-600 mb-6">
						Modifique la información del paciente
					</p>

					<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
						<form className="space-y-4" onSubmit={handleSubmit}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="form-control md:col-span-2">
									<label className="label">
										<span className="label-text font-medium">Nombre completo *</span>
									</label>
									<input
										type="text"
										name="nombre"
										className="input input-bordered"
										placeholder="Ej: Juan Pérez Rodríguez"
										value={formData.nombre}
										onChange={onChange}
										required
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text font-medium">Cédula *</span>
									</label>
									<input
										type="text"
										name="cedula"
										className="input input-bordered"
										placeholder="Ej: 112345678"
										value={formData.cedula}
										onChange={onChange}
										required
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text font-medium">Fecha de nacimiento *</span>
									</label>
									<input
										type="date"
										name="fecha_nacimiento"
										className="input input-bordered"
										value={formData.fecha_nacimiento}
										onChange={onChange}
										required
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text font-medium">Teléfono *</span>
									</label>
									<input
										type="tel"
										name="telefono"
										className="input input-bordered"
										placeholder="Ej: 88001122"
										value={formData.telefono}
										onChange={onChange}
										required
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text font-medium">Correo electrónico</span>
									</label>
									<input
										type="email"
										name="email"
										className="input input-bordered"
										placeholder="correo@ejemplo.com"
										value={formData.email}
										onChange={onChange}
									/>
								</div>

								<div className="form-control md:col-span-2">
									<label className="label">
										<span className="label-text font-medium">Alergias</span>
									</label>

									<div className="flex gap-2">
										<select
											className="select select-bordered w-full"
											value={alergiaSeleccionada}
											onChange={(e) => setAlergiaSeleccionada(e.target.value)}
										>
											<option value="">Seleccione una alergia</option>
											{alergiasDisponibles.map((alergia) => (
												<option key={alergia} value={alergia}>
													{alergia}
												</option>
											))}
										</select>

										<button
											type="button"
											className="btn btn-secondary"
											onClick={() => {
												agregarAlergia(alergiaSeleccionada);
												setAlergiaSeleccionada("");
											}}
										>
											Agregar
										</button>
									</div>

									<div className="flex flex-wrap gap-2 mt-3">
										{formData.alergias.length > 0 ? (
											formData.alergias.map((alergia) => (
												<div key={alergia} className="badge badge-warning gap-2 p-4">
													<span>{alergia}</span>
													<button
														type="button"
														onClick={() => eliminarAlergia(alergia)}
														className="font-bold"
													>
														✕
													</button>
												</div>
											))
										) : (
											<span className="text-sm text-gray-400">
												No se han agregado alergias
											</span>
										)}
									</div>
								</div>

								<div className="form-control md:col-span-2">
									<label className="label">
										<span className="label-text font-medium">Enfermedades relevantes</span>
									</label>

									<div className="flex gap-2">
										<select
											className="select select-bordered w-full"
											value={enfermedadSeleccionada}
											onChange={(e) => setEnfermedadSeleccionada(e.target.value)}
										>
											<option value="">Seleccione una enfermedad</option>
											{enfermedadesDisponibles.map((enf) => (
												<option key={enf} value={enf}>
													{enf}
												</option>
											))}
										</select>

										<button
											type="button"
											className="btn btn-secondary"
											onClick={() => {
												agregarEnfermedad(enfermedadSeleccionada);
												setEnfermedadSeleccionada("");
											}}
										>
											Agregar
										</button>
									</div>

									<div className="flex flex-wrap gap-2 mt-3">
										{formData.enfermedades.length > 0 ? (
											formData.enfermedades.map((enf) => (
												<div key={enf} className="badge badge-info gap-2 p-4">
													<span>{enf}</span>
													<button
														type="button"
														onClick={() => eliminarEnfermedad(enf)}
														className="font-bold"
													>
														✕
													</button>
												</div>
											))
										) : (
											<span className="text-sm text-gray-400">
												No se han agregado enfermedades
											</span>
										)}
									</div>
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => navigate("/pacientes")}
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="btn btn-secondary"
									disabled={guardando}
								>
									{guardando ? (
										<span className="loading loading-spinner loading-xs" />
									) : (
										"Guardar Cambios"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>

			{exito && (
				<div className="toast toast-bottom toast-end z-50 mr-4 mb-4">
					<div className="bg-white border border-gray-200 rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px] max-w-[600	px] animate-fade-in">
						<div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
							<Pencil size={22} />
						</div>

						<div className="flex-1">
							<p className="text-base font-semibold text-gray-800">
								El paciente ha sido editado correctamente
							</p>
							<p className="text-sm text-gray-500 mt-1">
								La información fue actualizada exitosamente
							</p>
						</div>

						<button
							onClick={() => setExito(false)}
							className="text-gray-400 hover:text-gray-600 transition"
						>
						✕
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default EditarPaciente;