import { useState } from "react";
import Navbar from "../components/Navbar";
import { Search, Plus, FileText, X, Eye } from "lucide-react";
import { COMPROBANTES, PACIENTES, USUARIOS } from "../data/mockData";

const TIPOS_COMPROBANTE = [
	"Constancia de atención",
	"Incapacidad",
	"Justificación laboral",
	"Recibo de pago",
];

const Comprobantes = () => {
	const [comprobantes, setComprobantes] = useState(COMPROBANTES);
	const [busqueda, setBusqueda] = useState("");
	const [tipoFiltro, setTipoFiltro] = useState("");
	const [mostrarModal, setMostrarModal] = useState(false);
	const [mostrarDetalle, setMostrarDetalle] = useState(null);
	const [guardando, setGuardando] = useState(false);
	const [formNuevo, setFormNuevo] = useState({
		paciente_id: "",
		usuario_id: "u1",
		tipo: "Constancia de atención",
		fecha: new Date().toISOString().split("T")[0],
		hora_inicio: "",
		hora_fin: "",
		descripcion: "",
	});

	const comprobantesFiltrados = comprobantes.filter((c) => {
		const term = busqueda.toLowerCase();
		const coincide =
			c.paciente_id.nombre.toLowerCase().includes(term) ||
			c.numero.toLowerCase().includes(term);
		const coincideTipo = tipoFiltro ? c.tipo === tipoFiltro : true;
		return coincide && coincideTipo;
	});

	const handleGuardar = (e) => {
		e.preventDefault();
		setGuardando(true);

		const paciente = PACIENTES.find((p) => p._id === formNuevo.paciente_id);
		const usuario = USUARIOS.find((u) => u._id === formNuevo.usuario_id);

		setTimeout(() => {
			const nuevo = {
				_id: `cp${Date.now()}`,
				numero: `COMP-2026-${String(comprobantes.length + 1).padStart(3, "0")}`,
				paciente_id: { _id: paciente._id, nombre: paciente.nombre },
				usuario_id: { _id: usuario._id, nombre: usuario.nombre },
				tipo: formNuevo.tipo,
				fecha: formNuevo.fecha,
				hora_inicio: formNuevo.hora_inicio,
				hora_fin: formNuevo.hora_fin,
				descripcion: formNuevo.descripcion,
			};

			setComprobantes((prev) => [nuevo, ...prev]);
			setFormNuevo({
				paciente_id: "",
				usuario_id: "u1",
				tipo: "Constancia de atención",
				fecha: new Date().toISOString().split("T")[0],
				hora_inicio: "",
				hora_fin: "",
				descripcion: "",
			});
			setMostrarModal(false);
			setGuardando(false);
		}, 600);
	};

	const getBadgeTipo = (tipo) => {
		const colors = {
			"Constancia de atención": "badge-info",
			Incapacidad: "badge-warning",
			"Justificación laboral": "badge-secondary",
			"Recibo de pago": "badge-success",
		};
		return `badge ${colors[tipo] || "badge-neutral"}`;
	};

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-gray-800 mb-2">Comprobantes Médicos</h2>
						<div className="flex justify-between items-center mb-4">
							<p className="text-gray-600">
								Generación y gestión de documentos médicos digitales
							</p>
							<button
								className="btn btn-secondary"
								onClick={() => setMostrarModal(true)}
							>
								<Plus size={16} />
								Nuevo Comprobante
							</button>
						</div>

						<div className="grid grid-cols-4 gap-4 mb-4">
							<div className="col-span-3">
								<label className="input input-bordered flex items-center gap-2">
									<Search className="h-4 w-4 opacity-70" />
									<input
										type="text"
										className="grow"
										placeholder="Buscar por paciente o número de comprobante"
										value={busqueda}
										onChange={(e) => setBusqueda(e.target.value)}
									/>
								</label>
							</div>
							<div>
								<select
									className="select select-bordered w-full"
									value={tipoFiltro}
									onChange={(e) => setTipoFiltro(e.target.value)}
								>
									<option value="">Todos los tipos</option>
									{TIPOS_COMPROBANTE.map((t) => (
										<option key={t} value={t}>{t}</option>
									))}
								</select>
							</div>
						</div>
					</div>

					<div className="overflow-x-auto">
						{comprobantesFiltrados.length === 0 ? (
							<div className="text-center py-8">
								<FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
								<p className="text-gray-500">No se encontraron comprobantes</p>
							</div>
						) : (
							<table className="table">
								<thead>
									<tr>
										<th>Número</th>
										<th>Paciente</th>
										<th>Tipo</th>
										<th>Fecha</th>
										<th>Horario</th>
										<th>Doctor(a)</th>
										<th className="text-center">Acciones</th>
									</tr>
								</thead>
								<tbody>
									{comprobantesFiltrados.map((comp) => (
										<tr key={comp._id}>
											<td className="font-mono text-sm font-medium">{comp.numero}</td>
											<td>{comp.paciente_id.nombre}</td>
											<td>
												<span className={getBadgeTipo(comp.tipo)}>
													{comp.tipo}
												</span>
											</td>
											<td>
												{new Date(comp.fecha + "T12:00:00").toLocaleDateString("es-CR", {
													day: "2-digit",
													month: "short",
													year: "numeric",
												})}
											</td>
											<td className="font-mono text-sm">
												{comp.hora_inicio} – {comp.hora_fin}
											</td>
											<td className="text-sm text-gray-600">
												{comp.usuario_id.nombre}
											</td>
											<td className="text-center">
												<button
													className="btn btn-sm btn-neutral btn-outline"
													onClick={() => setMostrarDetalle(comp)}
												>
													<Eye size={14} />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>

			{mostrarModal && (
				<dialog className="modal modal-open">
					<div className="modal-box max-w-lg">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Nuevo Comprobante</h3>
							<button className="btn btn-ghost btn-sm" onClick={() => setMostrarModal(false)}>
								<X className="w-4 h-4" />
							</button>
						</div>

						<form className="space-y-3" onSubmit={handleGuardar}>
							<div className="form-control">
								<label className="label"><span className="label-text">Paciente *</span></label>
								<select
									className="select select-bordered"
									value={formNuevo.paciente_id}
									onChange={(e) => setFormNuevo((p) => ({ ...p, paciente_id: e.target.value }))}
									required
								>
									<option value="">Seleccionar paciente</option>
									{PACIENTES.filter((p) => p.activo).map((p) => (
										<option key={p._id} value={p._id}>{p.nombre}</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="form-control">
									<label className="label"><span className="label-text">Tipo *</span></label>
									<select
										className="select select-bordered"
										value={formNuevo.tipo}
										onChange={(e) => setFormNuevo((p) => ({ ...p, tipo: e.target.value }))}
									>
										{TIPOS_COMPROBANTE.map((t) => (
											<option key={t} value={t}>{t}</option>
										))}
									</select>
								</div>
								<div className="form-control">
									<label className="label"><span className="label-text">Fecha *</span></label>
									<input
										type="date"
										className="input input-bordered"
										value={formNuevo.fecha}
										onChange={(e) => setFormNuevo((p) => ({ ...p, fecha: e.target.value }))}
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="form-control">
									<label className="label"><span className="label-text">Hora inicio</span></label>
									<input
										type="time"
										className="input input-bordered"
										value={formNuevo.hora_inicio}
										onChange={(e) => setFormNuevo((p) => ({ ...p, hora_inicio: e.target.value }))}
									/>
								</div>
								<div className="form-control">
									<label className="label"><span className="label-text">Hora fin</span></label>
									<input
										type="time"
										className="input input-bordered"
										value={formNuevo.hora_fin}
										onChange={(e) => setFormNuevo((p) => ({ ...p, hora_fin: e.target.value }))}
									/>
								</div>
							</div>

							<div className="form-control">
								<label className="label"><span className="label-text">Descripción *</span></label>
								<textarea
									className="textarea textarea-bordered"
									placeholder="Describa el procedimiento realizado"
									value={formNuevo.descripcion}
									onChange={(e) => setFormNuevo((p) => ({ ...p, descripcion: e.target.value }))}
									required
								/>
							</div>

							<div className="modal-action">
								<button type="button" className="btn btn-ghost" onClick={() => setMostrarModal(false)}>Cancelar</button>
								<button type="submit" className="btn btn-secondary" disabled={guardando}>
									{guardando ? <span className="loading loading-spinner loading-xs" /> : "Generar Comprobante"}
								</button>
							</div>
						</form>
					</div>
				</dialog>
			)}

			{mostrarDetalle && (
				<dialog className="modal modal-open">
					<div className="modal-box max-w-md">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Comprobante {mostrarDetalle.numero}</h3>
							<button className="btn btn-ghost btn-sm" onClick={() => setMostrarDetalle(null)}>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="border border-gray-200 rounded-lg p-4 space-y-3">
							<div className="text-center border-b pb-3">
								<p className="text-xl font-bold">ꨄ︎ Armonía Dental</p>
								<p className="text-sm text-gray-500">Teléfono: 61119106</p>
								<p className="text-sm text-gray-500">lau_ure@icloud.com</p>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-500">Número:</span>
								<span className="font-mono font-semibold text-sm">{mostrarDetalle.numero}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-500">Tipo:</span>
								<span className={getBadgeTipo(mostrarDetalle.tipo)}>{mostrarDetalle.tipo}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-500">Paciente:</span>
								<span className="font-medium text-sm">{mostrarDetalle.paciente_id.nombre}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-500">Fecha:</span>
								<span className="text-sm">
									{new Date(mostrarDetalle.fecha + "T12:00:00").toLocaleDateString("es-CR")}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-500">Horario:</span>
								<span className="font-mono text-sm">
									{mostrarDetalle.hora_inicio} – {mostrarDetalle.hora_fin}
								</span>
							</div>
							<div>
								<p className="text-sm text-gray-500 mb-1">Descripción:</p>
								<p className="text-sm bg-gray-50 p-2 rounded">{mostrarDetalle.descripcion}</p>
							</div>
							<div className="flex justify-between border-t pt-2">
								<span className="text-sm text-gray-500">Doctor(a):</span>
								<span className="text-sm font-medium">{mostrarDetalle.usuario_id.nombre}</span>
							</div>
						</div>

						<div className="modal-action">
							<button
								className="btn btn-secondary btn-sm"
								onClick={() =>
									alert("Funcionalidad de exportación PDF disponible con conexión al backend")
								}
							>
								📄 Exportar PDF
							</button>
							<button className="btn btn-ghost" onClick={() => setMostrarDetalle(null)}>
								Cerrar
							</button>
						</div>
					</div>
				</dialog>
			)}
		</div>
	);
};

export default Comprobantes;