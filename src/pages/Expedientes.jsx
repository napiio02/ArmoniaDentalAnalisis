import { useState } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { Search, Plus, FileText, ChevronDown, ChevronUp, Stethoscope } from "lucide-react";
import { PACIENTES, EXPEDIENTES } from "../data/mockData";

const Expedientes = () => {
	const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
	const [busqueda, setBusqueda] = useState("");
	const [pacientesMostrados, setPacientesMostrados] = useState(5);

	const pacientesFiltrados = PACIENTES.filter((p) => {
		const termino = busqueda.toLowerCase();
		return (
			p.nombre.toLowerCase().includes(termino) ||
			p.cedula.includes(termino)
		);
	});

	const pacientesAMostrar = pacientesFiltrados.slice(0, pacientesMostrados);
	const hayMas = pacientesFiltrados.length > pacientesMostrados;

	const expedientesPaciente = pacienteSeleccionado
		? EXPEDIENTES.filter((e) => e.paciente_id === pacienteSeleccionado._id)
		: [];

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-gray-800 mb-2">
							Expediente Clínico
						</h2>
						<div className="flex justify-between items-center mb-4">
							<p className="text-gray-600">
								Historial médico de los pacientes de la clínica
							</p>
						</div>
					</div>

					<div className="grid lg:grid-cols-7 gap-4">
						{/* Lista de pacientes */}
						<div className="lg:col-span-2 space-y-4">
							<div className="bg-white border rounded-md p-3">
								<h2 className="font-semibold text-gray-700 text-xl flex items-center gap-2 mb-3 mt-1">
									<Stethoscope className="text-sky-400" />
									Pacientes ({pacientesFiltrados.length})
								</h2>
								<div className="relative mb-4">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
									<input
										type="text"
										placeholder="Buscar paciente..."
										value={busqueda}
										onChange={(e) => setBusqueda(e.target.value)}
										className="input input-bordered w-full pl-10"
									/>
								</div>

								{pacientesAMostrar.length > 0 ? (
									<>
										{pacientesAMostrar.map((paciente) => (
											<button
												key={paciente._id}
												onClick={() => setPacienteSeleccionado(paciente)}
												className={`rounded-lg border border-gray-200 shadow-sm w-full text-left p-4 mb-2 hover:bg-gray-50 transition-colors ${
													pacienteSeleccionado?._id === paciente._id
														? "bg-primary/10 border-l-4 border-l-primary"
														: ""
												}`}
											>
												<div className="flex-1 min-w-0">
													<div className="flex justify-between items-center">
														<p className="font-semibold text-gray-800 truncate">
															{paciente.nombre}
														</p>
														{!paciente.activo && (
															<span className="badge badge-error badge-xs">Inactivo</span>
														)}
													</div>
													<p className="text-sm text-gray-600">
														Cédula: {paciente.cedula}
													</p>
													{paciente.alergias !== "Ninguna" && (
														<p className="text-xs text-amber-600 font-medium">
															⚠️ {paciente.alergias}
														</p>
													)}
												</div>
											</button>
										))}

										{hayMas && (
											<button
												onClick={() => setPacientesMostrados((p) => p + 5)}
												className="w-full p-3 text-center btn btn-secondary mt-2"
											>
												<ChevronDown className="inline w-4 h-4 mr-1" />
												Ver más ({pacientesFiltrados.length - pacientesMostrados} restantes)
											</button>
										)}

										{pacientesMostrados > 5 && !hayMas && (
											<button
												onClick={() => setPacientesMostrados(5)}
												className="w-full p-3 text-center btn mt-2"
											>
												<ChevronUp className="inline w-4 h-4 mr-1" />
												Ver menos
											</button>
										)}
									</>
								) : (
									<div className="p-8 text-center text-gray-500">
										<FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
										<p>No se encontraron pacientes</p>
									</div>
								)}
							</div>
						</div>

						{/* Detalle del expediente */}
						<div className="lg:col-span-5">
							{pacienteSeleccionado ? (
								<div className="space-y-4">
									{/* Info del paciente */}
									<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
										<div className="flex justify-between items-start mb-4">
											<div>
												<h3 className="text-2xl font-bold text-gray-800">
													{pacienteSeleccionado.nombre}
												</h3>
												<p className="text-gray-500">
													Cédula: {pacienteSeleccionado.cedula} · Tel:{" "}
													{pacienteSeleccionado.telefono}
												</p>
											</div>
											<span
												className={`badge ${
													pacienteSeleccionado.activo
														? "badge-primary"
														: "badge-error"
												}`}
											>
												{pacienteSeleccionado.activo ? "Activo" : "Inactivo"}
											</span>
										</div>

										<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
											<div>
												<p className="text-gray-500">Fecha de nacimiento</p>
												<p className="font-medium">
													{new Date(pacienteSeleccionado.fecha_nacimiento).toLocaleDateString("es-CR")}
												</p>
											</div>
											<div>
												<p className="text-gray-500">Correo</p>
												<p className="font-medium">{pacienteSeleccionado.email || "—"}</p>
											</div>
											<div>
												<p className="text-gray-500">Alergias</p>
												<p
													className={`font-medium ${
														pacienteSeleccionado.alergias !== "Ninguna"
															? "text-amber-600"
															: ""
													}`}
												>
													{pacienteSeleccionado.alergias}
												</p>
											</div>
											<div>
												<p className="text-gray-500">Enfermedades</p>
												<p className="font-medium">
													{pacienteSeleccionado.enfermedades}
												</p>
											</div>
										</div>
									</div>

									{/* Historial clínico */}
									<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
										<div className="flex justify-between items-center mb-4">
											<h3 className="font-semibold text-gray-800 text-lg">
												Historial de Atenciones
											</h3>
											<button className="btn btn-secondary btn-sm">
												<Plus size={14} /> Nueva Anotación
											</button>
										</div>

										{expedientesPaciente.length === 0 ? (
											<div className="text-center py-10 text-gray-500">
												<FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
												<p>No hay registros de atenciones aún</p>
											</div>
										) : (
											<div className="space-y-4">
												{expedientesPaciente.map((exp) => (
													<div
														key={exp._id}
														className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
													>
														<div className="flex items-center justify-between mb-2">
															<div className="flex items-center gap-2">
																<span className="badge badge-neutral">
																	{exp.tipo}
																</span>
																<span className="text-sm text-gray-500">
																	{new Date(exp.fecha).toLocaleDateString("es-CR", {
																		day: "2-digit",
																		month: "long",
																		year: "numeric",
																	})}
																</span>
															</div>
															<span className="text-xs text-gray-400">
																Dr(a). {exp.doctor}
															</span>
														</div>
														<p className="text-gray-700 text-sm mb-2">
															{exp.descripcion}
														</p>
														<p className="text-sm text-sky-700 font-medium">
															Tratamiento: {exp.tratamiento}
														</p>
														{exp.proximo_control && (
															<p className="text-xs text-gray-500 mt-1">
																Próximo control:{" "}
																{new Date(exp.proximo_control).toLocaleDateString("es-CR")}
															</p>
														)}
														{exp.adjuntos.length > 0 && (
															<div className="mt-2 flex gap-2 flex-wrap">
																{exp.adjuntos.map((a) => (
																	<span
																		key={a}
																		className="badge badge-outline badge-sm"
																	>
																		📎 {a}
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
								<div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
									<Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-200" />
									<p className="text-lg font-medium text-gray-400">
										Seleccione un paciente para ver su expediente
									</p>
									<p className="text-sm text-gray-400 mt-1">
										Puede buscar por nombre o cédula en la lista de la izquierda
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Expedientes;
