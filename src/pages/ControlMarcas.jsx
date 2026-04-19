import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import { Clock, Plus, X, Filter } from "lucide-react";
import { MARCAS, USUARIOS } from "../data/mockData";

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
				usuario_id: { _id: usuario._id, nombre: usuario.nombre, rol: usuario.rol },
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
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-gray-800 mb-2">
							Control de Marcas
						</h2>
						<div className="flex justify-between items-center mb-6">
							<p className="text-gray-600">
								Registro de entrada y salida del personal de la clínica
							</p>
							<button
								className="btn btn-secondary"
								onClick={() => setMostrarModal(true)}
							>
								<Plus size={16} />
								Registrar Marca
							</button>
						</div>

						{/* Resumen por empleado */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
							{resumenPorEmpleado.map((emp) => (
								<div
									key={emp.nombre}
									className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 hover:shadow-md transition-shadow"
								>
									<div className="flex items-center gap-3 mb-3">
										<div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
											<span className="text-primary font-bold text-lg">
												{emp.nombre.charAt(0)}
											</span>
										</div>
										<div>
											<p className="font-semibold text-gray-800 text-sm">
												{emp.nombre}
											</p>
											<p className="text-xs text-gray-500">{emp.rol}</p>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div className="bg-gray-50 rounded p-2 text-center">
											<p className="text-gray-500 text-xs">Días trabajados</p>
											<p className="font-bold text-gray-800">{emp.diasTrabajados}</p>
										</div>
										<div className="bg-gray-50 rounded p-2 text-center">
											<p className="text-gray-500 text-xs">Total horas</p>
											<p className="font-bold text-gray-800">
												{emp.totalHoras.toFixed(1)}h
											</p>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Filtros */}
						<div className="flex flex-wrap gap-3 mb-4">
							<div className="flex items-center gap-2">
								<Filter className="w-4 h-4 text-gray-400" />
								<span className="text-sm text-gray-600">Filtrar:</span>
							</div>
							<input
								type="date"
								className="input input-bordered input-sm"
								value={filtroFecha}
								onChange={(e) => setFiltroFecha(e.target.value)}
							/>
							<select
								className="select select-bordered select-sm"
								value={filtroUsuario}
								onChange={(e) => setFiltroUsuario(e.target.value)}
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
									className="btn btn-ghost btn-sm"
									onClick={() => {
										setFiltroFecha("");
										setFiltroUsuario("");
									}}
								>
									Limpiar
								</button>
							)}
						</div>
					</div>

					{/* Tabla de marcas */}
					<div className="overflow-x-auto">
						{marcasFiltradas.length === 0 ? (
							<div className="text-center py-8">
								<Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
								<p className="text-gray-500">No hay marcas para los filtros seleccionados</p>
							</div>
						) : (
							<table className="table">
								<thead>
									<tr>
										<th></th>
										<th>Empleado</th>
										<th>Rol</th>
										<th>Fecha</th>
										<th>Entrada</th>
										<th>Salida</th>
										<th>Horas trabajadas</th>
										<th>Observaciones</th>
									</tr>
								</thead>
								<tbody>
									{marcasFiltradas.map((marca, index) => (
										<tr key={marca._id}>
											<th>{index + 1}</th>
											<td className="font-medium">{marca.usuario_id.nombre}</td>
											<td>
												<span className="badge badge-neutral badge-sm">
													{marca.usuario_id.rol}
												</span>
											</td>
											<td>
												{new Date(marca.fecha + "T12:00:00").toLocaleDateString("es-CR", {
													weekday: "short",
													day: "2-digit",
													month: "short",
												})}
											</td>
											<td className="font-mono">{marca.hora_entrada}</td>
											<td className="font-mono">{marca.hora_salida}</td>
											<td>
												<span
													className={`font-semibold ${
														marca.horas_trabajadas >= 9
															? "text-green-600"
															: marca.horas_trabajadas >= 8
															? "text-sky-600"
															: "text-amber-600"
													}`}
												>
													{marca.horas_trabajadas.toFixed(2)}h
												</span>
											</td>
											<td className="text-sm text-gray-500">
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

			{/* Modal nueva marca */}
			{mostrarModal && (
				<dialog className="modal modal-open">
					<div className="modal-box max-w-lg">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Registrar Marca</h3>
							<button
								className="btn btn-ghost btn-sm"
								onClick={() => setMostrarModal(false)}
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<form className="space-y-3" onSubmit={handleGuardar}>
							<div className="form-control">
								<label className="label">
									<span className="label-text">Empleado *</span>
								</label>
								<select
									className="select select-bordered"
									value={formNueva.usuario_id}
									onChange={(e) =>
										setFormNueva((p) => ({ ...p, usuario_id: e.target.value }))
									}
									required
								>
									<option value="">Seleccionar empleado</option>
									{USUARIOS.filter((u) => u.activo).map((u) => (
										<option key={u._id} value={u._id}>
											{u.nombre} ({u.rol})
										</option>
									))}
								</select>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Fecha *</span>
								</label>
								<input
									type="date"
									className="input input-bordered"
									value={formNueva.fecha}
									onChange={(e) =>
										setFormNueva((p) => ({ ...p, fecha: e.target.value }))
									}
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Hora de entrada *</span>
									</label>
									<input
										type="time"
										className="input input-bordered"
										value={formNueva.hora_entrada}
										onChange={(e) =>
											setFormNueva((p) => ({ ...p, hora_entrada: e.target.value }))
										}
										required
									/>
								</div>
								<div className="form-control">
									<label className="label">
										<span className="label-text">Hora de salida *</span>
									</label>
									<input
										type="time"
										className="input input-bordered"
										value={formNueva.hora_salida}
										onChange={(e) =>
											setFormNueva((p) => ({ ...p, hora_salida: e.target.value }))
										}
										required
									/>
								</div>
							</div>

							{formNueva.hora_entrada && formNueva.hora_salida && (
								<div className="bg-sky-50 border border-sky-200 rounded p-3 text-sm text-sky-700">
									⏱ Horas trabajadas calculadas:{" "}
									<strong>
										{calcularHoras(formNueva.hora_entrada, formNueva.hora_salida).toFixed(2)} horas
									</strong>
								</div>
							)}

							<div className="form-control">
								<label className="label">
									<span className="label-text">Observaciones</span>
								</label>
								<textarea
									className="textarea textarea-bordered"
									placeholder="Ej: Atendió emergencia, llegó tarde por..."
									value={formNueva.observaciones}
									onChange={(e) =>
										setFormNueva((p) => ({ ...p, observaciones: e.target.value }))
									}
								/>
							</div>

							<div className="modal-action">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => setMostrarModal(false)}
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
										"Registrar"
									)}
								</button>
							</div>
						</form>
					</div>
				</dialog>
			)}
		</div>
	);
};

export default ControlMarcas;
