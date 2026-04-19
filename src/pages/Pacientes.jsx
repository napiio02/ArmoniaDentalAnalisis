import { useState, useEffect } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Pagination from "../components/Paginacion";
import { Search, Eye, ToggleLeft, ToggleRight, Plus, Pencil } from "lucide-react";
import { PACIENTES } from "../data/mockData";

const Pacientes = () => {
	const [pacientes, setPacientes] = useState(PACIENTES);
	const [pacientesFiltrados, setPacientesFiltrados] = useState(PACIENTES);
	const [busqueda, setBusqueda] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("todo");
	const [paginaActual, setPaginaActual] = useState(1);
	const [statusLoading, setStatusLoading] = useState(null);

	const pacientesPorPagina = 10;

	useEffect(() => {
		filtrarPacientes();
		setPaginaActual(1);
	}, [busqueda, estadoFiltro, pacientes]);

	const filtrarPacientes = () => {
		let filtered = [...pacientes];

		if (busqueda) {
			filtered = filtered.filter(
				(p) =>
					p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
					p.email.toLowerCase().includes(busqueda.toLowerCase()) ||
					p.telefono.includes(busqueda) ||
					p.cedula.includes(busqueda)
			);
		}

		if (estadoFiltro !== "todo") {
			const isActive = estadoFiltro === "activo";
			filtered = filtered.filter((p) => p.activo === isActive);
		}

		setPacientesFiltrados(filtered);
	};

	const toggleEstadoPaciente = (pacienteId) => {
		setStatusLoading(pacienteId);
		setTimeout(() => {
			setPacientes((prev) =>
				prev.map((p) =>
					p._id === pacienteId ? { ...p, activo: !p.activo } : p
				)
			);
			setStatusLoading(null);
		}, 500);
	};

	const getBadgeEstado = (activo) => {
		return activo ? (
			<span className="badge badge-primary">Activo</span>
		) : (
			<span className="badge badge-error">Inactivo</span>
		);
	};

	const totalPaginas = Math.ceil(pacientesFiltrados.length / pacientesPorPagina);
	const indiceUltimo = paginaActual * pacientesPorPagina;
	const indicePrimero = indiceUltimo - pacientesPorPagina;
	const pacientesActuales = pacientesFiltrados.slice(indicePrimero, indiceUltimo);

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-gray-800 mb-2">Pacientes</h2>
						<div className="flex justify-between items-center mb-4">
							<p className="text-gray-600">
								Gestiona la información de los pacientes de la clínica
							</p>
							<Link to="/pacientes-nuevo" className="btn btn-secondary">
								<Plus size={16} />
								Nuevo Paciente
							</Link>
						</div>
						<div className="grid grid-cols-4 gap-4 mb-4">
							<div className="col-span-3">
								<label className="input input-bordered flex items-center gap-2">
									<Search className="h-4 w-4 opacity-70" />
									<input
										type="text"
										className="grow"
										placeholder="Buscar por nombre, correo, teléfono o cédula"
										value={busqueda}
										onChange={(e) => setBusqueda(e.target.value)}
									/>
								</label>
							</div>
							<div className="col-start-4">
								<select
									className="select select-bordered w-full"
									value={estadoFiltro}
									onChange={(e) => setEstadoFiltro(e.target.value)}
								>
									<option value="todo">Todos</option>
									<option value="activo">Activo</option>
									<option value="inactivo">Inactivo</option>
								</select>
							</div>
						</div>
					</div>

					<div className="overflow-x-auto">
						{pacientesFiltrados.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-500">
									{pacientes.length === 0
										? "No hay pacientes registrados"
										: "No se encontraron pacientes con los filtros aplicados"}
								</p>
							</div>
						) : (
							<>
								<table className="table">
									<thead>
										<tr>
											<th></th>
											<th>Nombre</th>
											<th>Cédula</th>
											<th>Teléfono</th>
											<th>Correo</th>
											<th>Alergias</th>
											<th>Estado</th>
											<th className="text-center">Acciones</th>
										</tr>
									</thead>
									<tbody>
										{pacientesActuales.map((paciente, index) => (
											<tr key={paciente._id}>
												<th>{indicePrimero + index + 1}</th>
												<td className="font-medium">{paciente.nombre}</td>
												<td>{paciente.cedula}</td>
												<td>{paciente.telefono}</td>
												<td>{paciente.email}</td>
												<td>
													{paciente.alergias !== "Ninguna" ? (
														<span className="badge badge-warning badge-sm">
															{paciente.alergias}
														</span>
													) : (
														<span className="text-gray-400 text-sm">Ninguna</span>
													)}
												</td>
												<td>{getBadgeEstado(paciente.activo)}</td>
												<td className="text-center">
													<div className="flex gap-2 justify-center">
														<Link
															to={`/pacientes/${paciente._id}`}
															className="btn btn-sm btn-neutral btn-outline"
														>
															<Eye size={16} />
														</Link>
														<button
															onClick={() => toggleEstadoPaciente(paciente._id)}
															disabled={statusLoading === paciente._id}
															className={`btn btn-sm btn-outline ${
																paciente.activo ? "btn-error" : "btn-success"
															}`}
														>
															{statusLoading === paciente._id ? (
																<span className="loading loading-spinner loading-xs"></span>
															) : paciente.activo ? (
																<ToggleRight size={16} />
															) : (
																<ToggleLeft size={16} />
															)}
														</button>

														<Link
															to={`/pacientes/editar/${paciente._id}`}
															className="btn btn-sm btn-primary btn-outline"
														>
															<Pencil size={16} />
														</Link>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>

								<Pagination
									paginaActual={paginaActual}
									totalPaginas={totalPaginas}
									onCambioPagina={setPaginaActual}
									totalItems={pacientesFiltrados.length}
									itemsPorPagina={pacientesPorPagina}
								/>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Pacientes;
