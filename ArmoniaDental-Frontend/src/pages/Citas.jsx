import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { CalendarClock, Clock4, Plus, X } from "lucide-react";
import { CITAS, PACIENTES, USUARIOS } from "../data/mockData";

const DURACIONES = {
	Limpieza: 45,
	Revisión: 30,
	Cirugía: 120,
	Blanqueamiento: 60,
	Ortodoncia: 30,
	Empaste: 60,
	Radiografía: 20,
};

const estados = ["Programada", "Confirmada", "En atención", "Atendida", "Cancelada", "No asistió"];
const tipos = ["Limpieza", "Revisión", "Cirugía", "Blanqueamiento", "Ortodoncia", "Empaste", "Radiografía"];

const Citas = () => {
	const [citas, setCitas] = useState(CITAS);
	const [filtroFecha, setFiltroFecha] = useState("");
	const [filtroEstado, setFiltroEstado] = useState("");
	const [filtroTipo, setFiltroTipo] = useState("");
	const [mostrarPasadas, setMostrarPasadas] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [mensajeError, setMensajeError] = useState("");

	const [formNueva, setFormNueva] = useState({
		paciente_id: "",
		usuario_id: "u1",
		fecha_hora: "",
		tipo: "Revisión",
		motivo: "",
		observaciones: "",
	});

	const [mostrarModal, setMostrarModal] = useState(false);
	const [citaEditando, setCitaEditando] = useState(null);
	const [formEditar, setFormEditar] = useState({
		fecha_hora: "",
		tipo: "",
		estado: "",
		observaciones: "",
		motivo: "",
	});

	const formatearFecha = (fecha) =>
		new Date(fecha).toLocaleString("es-CR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

	const toInputDateTime = (fecha) => {
		if (!fecha) return "";
		const d = new Date(fecha);
		const pad = (n) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	};

	const getFechaMinima = () => {
		const ahora = new Date();
		const pad = (n) => String(n).padStart(2, "0");
		return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
	};

	const handleChangeNueva = (e) => {
		const { name, value } = e.target;
		setFormNueva((prev) => ({ ...prev, [name]: value }));
	};

	const handleCrear = (e) => {
		e.preventDefault();
		setGuardando(true);
		setMensajeError("");

		const paciente = PACIENTES.find((p) => p._id === formNueva.paciente_id);
		const usuario = USUARIOS.find((u) => u._id === formNueva.usuario_id);

		setTimeout(() => {
			const nuevaCita = {
				_id: `c${Date.now()}`,
				paciente_id: { _id: paciente._id, nombre: paciente.nombre },
				usuario_id: { _id: usuario._id, nombre: usuario.nombre },
				fecha_hora: formNueva.fecha_hora,
				tipo: formNueva.tipo,
				estado: "Programada",
				motivo: formNueva.motivo,
				observaciones: formNueva.observaciones,
			};
			setCitas((prev) => [...prev, nuevaCita]);
			setFormNueva({
				paciente_id: "",
				usuario_id: "u1",
				fecha_hora: "",
				tipo: "Revisión",
				motivo: "",
				observaciones: "",
			});
			setGuardando(false);
		}, 600);
	};

	const abrirModalEditar = (cita) => {
		setCitaEditando(cita);
		setFormEditar({
			fecha_hora: toInputDateTime(cita.fecha_hora),
			tipo: cita.tipo,
			estado: cita.estado,
			observaciones: cita.observaciones || "",
			motivo: cita.motivo || "",
		});
		setMostrarModal(true);
	};

	const handleChangeEditar = (e) => {
		const { name, value } = e.target;
		setFormEditar((prev) => ({ ...prev, [name]: value }));
	};

	const handleGuardarEdicion = (e) => {
		e.preventDefault();
		setGuardando(true);
		setTimeout(() => {
			setCitas((prev) =>
				prev.map((c) =>
					c._id === citaEditando._id ? { ...c, ...formEditar } : c
				)
			);
			setMostrarModal(false);
			setCitaEditando(null);
			setGuardando(false);
		}, 500);
	};

	const cancelarCita = (citaId) => {
		if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
		setCitas((prev) =>
			prev.map((c) => (c._id === citaId ? { ...c, estado: "Cancelada" } : c))
		);
	};

	const citasOrdenadas = useMemo(() => {
		const ahora = new Date().getTime();
		return [...citas].sort((a, b) => {
			const fechaA = new Date(a.fecha_hora).getTime();
			const fechaB = new Date(b.fecha_hora).getTime();
			const esFuturaA = fechaA >= ahora;
			const esFuturaB = fechaB >= ahora;
			if (esFuturaA === esFuturaB) return fechaA - fechaB;
			return esFuturaB ? 1 : -1;
		});
	}, [citas]);

	const citasFiltradas = useMemo(() => {
		const ahora = new Date();
		return citasOrdenadas.filter((cita) => {
			if (!mostrarPasadas && new Date(cita.fecha_hora) < ahora) return false;
			if (filtroFecha) {
				const fechaCita = new Date(cita.fecha_hora).toISOString().split("T")[0];
				if (fechaCita !== filtroFecha) return false;
			}
			if (filtroEstado && cita.estado !== filtroEstado) return false;
			if (filtroTipo && cita.tipo !== filtroTipo) return false;
			return true;
		});
	}, [citasOrdenadas, mostrarPasadas, filtroFecha, filtroEstado, filtroTipo]);

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-3xl font-bold text-gray-800">
										Agenda de Citas
									</h2>
								</div>
								<p className="text-gray-600">
									Programa y controla limpiezas, cirugías, revisiones y blanqueamientos
								</p>
							</div>
						</div>

						<div className="grid lg:grid-cols-[2fr,3fr] gap-6">
							{/* Formulario nueva cita */}
							<div className="bg-base-100 border border-gray-200 rounded-xl p-5 shadow-sm">
								<h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
									<Plus className="w-4 h-4" /> Nueva Cita
								</h3>

								{mensajeError && (
									<div className="alert alert-error mb-3">
										<span>{mensajeError}</span>
									</div>
								)}

								<form className="space-y-3" onSubmit={handleCrear}>
									<div className="form-control">
										<label className="label">
											<span className="label-text">Paciente</span>
										</label>
										<select
											name="paciente_id"
											className="select select-bordered"
											value={formNueva.paciente_id}
											onChange={handleChangeNueva}
											required
										>
											<option value="">Seleccionar paciente</option>
											{PACIENTES.filter((p) => p.activo).map((p) => (
												<option key={p._id} value={p._id}>
													{p.nombre}
												</option>
											))}
										</select>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div className="form-control">
											<label className="label">
												<span className="label-text">Doctor(a)</span>
											</label>
											<select
												name="usuario_id"
												className="select select-bordered"
												value={formNueva.usuario_id}
												onChange={handleChangeNueva}
												required
											>
												{USUARIOS.filter((u) => u.rol === "Dentista" || u.rol === "Admin").map((u) => (
													<option key={u._id} value={u._id}>
														{u.nombre}
													</option>
												))}
											</select>
										</div>
										<div className="form-control">
											<label className="label">
												<span className="label-text">Tipo de cita</span>
											</label>
											<select
												name="tipo"
												className="select select-bordered"
												value={formNueva.tipo}
												onChange={handleChangeNueva}
												required
											>
												{tipos.map((t) => (
													<option key={t} value={t}>{t}</option>
												))}
											</select>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div className="form-control">
											<label className="label">
												<span className="label-text">Fecha y hora</span>
											</label>
											<input
												type="datetime-local"
												name="fecha_hora"
												className="input input-bordered"
												value={formNueva.fecha_hora}
												onChange={handleChangeNueva}
												min={getFechaMinima()}
												required
											/>
										</div>
										<div className="form-control">
											<label className="label">
												<span className="label-text">Duración estimada</span>
											</label>
											<input
												type="text"
												className="input input-bordered"
												value={`${DURACIONES[formNueva.tipo] || 30} minutos`}
												disabled
											/>
										</div>
									</div>

									<div className="form-control">
										<label className="label">
											<span className="label-text">Motivo</span>
										</label>
										<textarea
											name="motivo"
											className="textarea textarea-bordered"
											value={formNueva.motivo}
											onChange={handleChangeNueva}
											placeholder="Describa el motivo de la cita"
											required
										/>
									</div>

									<div className="form-control">
										<label className="label">
											<span className="label-text">Observaciones</span>
										</label>
										<textarea
											name="observaciones"
											className="textarea textarea-bordered"
											value={formNueva.observaciones}
											onChange={handleChangeNueva}
											placeholder="Observaciones adicionales (opcional)"
										/>
									</div>

									<div className="flex justify-end">
										<button
											type="submit"
											className="btn btn-secondary"
											disabled={guardando}
										>
											{guardando ? (
												<span className="loading loading-spinner loading-xs" />
											) : (
												"Crear Cita"
											)}
										</button>
									</div>
								</form>
							</div>

							{/* Lista de citas */}
							<div className="bg-base-100 border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
								<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
									<h3 className="font-semibold text-gray-800">Próximas Citas</h3>
									<div className="flex flex-wrap gap-2">
										<input
											type="date"
											className="input input-bordered input-sm"
											value={filtroFecha}
											onChange={(e) => setFiltroFecha(e.target.value)}
										/>
										<select
											className="select select-bordered select-sm"
											value={filtroEstado}
											onChange={(e) => setFiltroEstado(e.target.value)}
										>
											<option value="">Estado</option>
											{estados.map((e) => (
												<option key={e} value={e}>{e}</option>
											))}
										</select>
										<select
											className="select select-bordered select-sm"
											value={filtroTipo}
											onChange={(e) => setFiltroTipo(e.target.value)}
										>
											<option value="">Tipo</option>
											{tipos.map((t) => (
												<option key={t} value={t}>{t}</option>
											))}
										</select>
										<button
											className="btn btn-ghost btn-sm"
											onClick={() => {
												setFiltroFecha("");
												setFiltroEstado("");
												setFiltroTipo("");
											}}
										>
											Limpiar
										</button>
									</div>
								</div>

								<label className="label cursor-pointer justify-start gap-2">
									<input
										type="checkbox"
										className="checkbox checkbox-sm"
										checked={mostrarPasadas}
										onChange={(e) => setMostrarPasadas(e.target.checked)}
									/>
									<span className="label-text">Mostrar citas pasadas</span>
								</label>

								{citasFiltradas.length === 0 ? (
									<div className="text-center py-10">
										<CalendarClock className="w-12 h-12 mx-auto mb-2 text-gray-200" />
										<p className="text-gray-500">
											No hay citas para los filtros seleccionados.
										</p>
									</div>
								) : (
									<div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
										{citasFiltradas.map((cita) => (
											<div
												key={cita._id}
												className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
											>
												<div className="flex items-center justify-between gap-3">
													<div className="flex flex-col">
														<div className="flex items-center gap-2 text-sm text-gray-600">
															<Clock4 className="w-4 h-4" />
															<span>{formatearFecha(cita.fecha_hora)}</span>
															<span className="text-xs text-gray-500">
																{DURACIONES[cita.tipo] || 30} min
															</span>
														</div>
														<p className="text-lg font-semibold text-gray-800">
															{cita.tipo} · {cita.motivo}
														</p>
														<p className="text-sm text-gray-600">
															{cita.paciente_id?.nombre}
														</p>
														<p className="text-xs text-gray-500">
															Doctor(a): {cita.usuario_id?.nombre || "N/A"}
														</p>
													</div>
													<div className="flex flex-col gap-2 items-end">
														<span
															className={`badge font-medium ${
																cita.estado === "Cancelada"
																	? "badge-error"
																	: cita.estado === "Atendida"
																	? "badge-primary"
																	: cita.estado === "Programada"
																	? "badge-warning"
																	: cita.estado === "Confirmada"
																	? "bg-sky-400 border-sky-400 text-white"
																	: cita.estado === "No asistió"
																	? "badge-neutral"
																	: "badge-neutral"
															}`}
														>
															{cita.estado}
														</span>
														<div className="flex gap-2">
															<button
																className="btn btn-xs btn-outline"
																onClick={() => abrirModalEditar(cita)}
															>
																Editar
															</button>
															<button
																className="btn btn-xs btn-ghost text-error"
																onClick={() => cancelarCita(cita._id)}
																disabled={cita.estado === "Cancelada"}
															>
																Cancelar
															</button>
														</div>
													</div>
												</div>

												{cita.observaciones && (
													<p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
														{cita.observaciones}
													</p>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Modal editar cita */}
			{mostrarModal && citaEditando && (
				<dialog className="modal modal-open">
					<div className="modal-box max-w-2xl">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Editar cita</h3>
							<button
								className="btn btn-ghost btn-sm"
								onClick={() => setMostrarModal(false)}
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<form className="space-y-3" onSubmit={handleGuardarEdicion}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Fecha y hora</span>
									</label>
									<input
										type="datetime-local"
										name="fecha_hora"
										className="input input-bordered"
										value={formEditar.fecha_hora}
										onChange={handleChangeEditar}
										required
									/>
								</div>
								<div className="form-control">
									<label className="label">
										<span className="label-text">Tipo</span>
									</label>
									<select
										name="tipo"
										className="select select-bordered"
										value={formEditar.tipo}
										onChange={handleChangeEditar}
										required
									>
										{tipos.map((t) => (
											<option key={t} value={t}>{t}</option>
										))}
									</select>
								</div>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Estado</span>
								</label>
								<select
									name="estado"
									className="select select-bordered"
									value={formEditar.estado}
									onChange={handleChangeEditar}
									required
								>
									{estados.map((e) => (
										<option key={e} value={e}>{e}</option>
									))}
								</select>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Motivo</span>
								</label>
								<textarea
									name="motivo"
									className="textarea textarea-bordered"
									value={formEditar.motivo}
									onChange={handleChangeEditar}
									required
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Observaciones</span>
								</label>
								<textarea
									name="observaciones"
									className="textarea textarea-bordered"
									value={formEditar.observaciones}
									onChange={handleChangeEditar}
								/>
							</div>

							{mensajeError && (
								<div className="alert alert-error">
									<span>{mensajeError}</span>
								</div>
							)}

							<div className="modal-action">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => setMostrarModal(false)}
								>
									Cerrar
								</button>
								<button
									type="submit"
									className="btn btn-primary"
									disabled={guardando}
								>
									{guardando ? (
										<span className="loading loading-spinner loading-xs" />
									) : (
										"Guardar cambios"
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

export default Citas;
