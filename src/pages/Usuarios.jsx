import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Search, ToggleLeft, ToggleRight, Plus, Pencil } from "lucide-react";
import { USUARIOS } from "../data/mockData";

const ROLES = ["Dentista", "Asistente Dental", "Recepcionista", "Admin"];

const Usuarios = () => {
	const [usuarios, setUsuarios] = useState(USUARIOS);
	const [usuariosFiltrados, setUsuariosFiltrados] = useState(USUARIOS);
	const [busqueda, setBusqueda] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("todo");
	const [rolFiltro, setRolFiltro] = useState("todo");
	const [statusLoading, setStatusLoading] = useState(null);
	const [mostrarModal, setMostrarModal] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [formNuevo, setFormNuevo] = useState({
		nombre: "",
		email: "",
		cedula: "",
		telefono: "",
		rol: "Recepcionista",
	});

	useEffect(() => {
		filtrar();
	}, [busqueda, estadoFiltro, rolFiltro, usuarios]);

	const filtrar = () => {
		let filtered = [...usuarios];

		if (busqueda) {
			const term = busqueda.toLowerCase();
			filtered = filtered.filter(
				(u) =>
					u.nombre.toLowerCase().includes(term) ||
					u.email.toLowerCase().includes(term) ||
					u.cedula.includes(term)
			);
		}

		if (estadoFiltro !== "todo") {
			filtered = filtered.filter((u) => u.activo === (estadoFiltro === "activo"));
		}

		if (rolFiltro !== "todo") {
			filtered = filtered.filter((u) => u.rol === rolFiltro);
		}

		setUsuariosFiltrados(filtered);
	};

	const toggleEstado = (id) => {
		setStatusLoading(id);
		setTimeout(() => {
			setUsuarios((prev) =>
				prev.map((u) => (u._id === id ? { ...u, activo: !u.activo } : u))
			);
			setStatusLoading(null);
		}, 500);
	};

	const handleGuardar = (e) => {
		e.preventDefault();
		setGuardando(true);
		setTimeout(() => {
			const nuevo = {
				_id: `u${Date.now()}`,
				...formNuevo,
				activo: true,
			};
			setUsuarios((prev) => [...prev, nuevo]);
			setFormNuevo({ nombre: "", email: "", cedula: "", telefono: "", rol: "Recepcionista" });
			setMostrarModal(false);
			setGuardando(false);
		}, 600);
	};

	const getBadgeRol = (rol) => {
		const colors = {
			Dentista: "badge-primary",
			"Asistente Dental": "badge-secondary",
			Recepcionista: "badge-info",
			Admin: "badge-warning",
		};
		return `badge ${colors[rol] || "badge-neutral"}`;
	};

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-gray-800 mb-2">Usuarios</h2>
						<div className="flex justify-between items-center mb-4">
							<p className="text-gray-600">
								Gestión del personal de Armonía Dental
							</p>
							<button
								className="btn btn-secondary"
								onClick={() => setMostrarModal(true)}
							>
								<Plus size={16} />
								Registrar Usuario
							</button>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
							<div>
								<label className="input input-bordered flex items-center gap-2">
									<Search className="h-4 w-4 opacity-70" />
									<input
										type="text"
										className="grow"
										placeholder="Buscar por nombre, correo o cédula"
										value={busqueda}
										onChange={(e) => setBusqueda(e.target.value)}
									/>
								</label>
							</div>
							<div>
								<select
									className="select select-bordered w-full"
									value={rolFiltro}
									onChange={(e) => setRolFiltro(e.target.value)}
								>
									<option value="todo">Todos los roles</option>
									{ROLES.map((r) => (
										<option key={r} value={r}>{r}</option>
									))}
								</select>
							</div>
							<div>
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
						{usuariosFiltrados.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-500">No se encontraron usuarios</p>
							</div>
						) : (
							<table className="table">
								<thead>
									<tr>
										<th></th>
										<th>Nombre</th>
										<th>Cédula</th>
										<th>Correo</th>
										<th>Teléfono</th>
										<th>Rol</th>
										<th>Estado</th>
										<th className="text-center">Acciones</th>
									</tr>
								</thead>
								<tbody>
									{usuariosFiltrados.map((usuario, index) => (
										<tr key={usuario._id}>
											<th>{index + 1}</th>
											<td className="font-medium">{usuario.nombre}</td>
											<td>{usuario.cedula}</td>
											<td>{usuario.email}</td>
											<td>{usuario.telefono}</td>
											<td>
												<span className={getBadgeRol(usuario.rol)}>
													{usuario.rol}
												</span>
											</td>
											<td>
												{usuario.activo ? (
													<span className="badge badge-primary">Activo</span>
												) : (
													<span className="badge badge-error">Inactivo</span>
												)}
											</td>
											<td className="text-center">
												<div className="flex gap-2 justify-center">
													<button
														onClick={() => toggleEstado(usuario._id)}
														disabled={statusLoading === usuario._id}
														className={`btn btn-sm btn-outline ${
															usuario.activo ? "btn-error" : "btn-success"
														}`}
													>
														{statusLoading === usuario._id ? (
															<span className="loading loading-spinner loading-xs"></span>
														) : usuario.activo ? (
															<ToggleRight size={16} />
														) : (
															<ToggleLeft size={16} />
														)}
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>

			{/* Modal nuevo usuario */}
			{mostrarModal && (
				<dialog className="modal modal-open">
					<div className="modal-box max-w-lg">
						<h3 className="font-bold text-lg mb-4">Registrar Usuario</h3>

						<form className="space-y-3" onSubmit={handleGuardar}>
							<div className="form-control">
								<label className="label"><span className="label-text">Nombre completo *</span></label>
								<input
									type="text"
									className="input input-bordered"
									value={formNuevo.nombre}
									onChange={(e) => setFormNuevo((p) => ({ ...p, nombre: e.target.value }))}
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="form-control">
									<label className="label"><span className="label-text">Cédula *</span></label>
									<input
										type="text"
										className="input input-bordered"
										value={formNuevo.cedula}
										onChange={(e) => setFormNuevo((p) => ({ ...p, cedula: e.target.value }))}
										required
									/>
								</div>
								<div className="form-control">
									<label className="label"><span className="label-text">Teléfono</span></label>
									<input
										type="tel"
										className="input input-bordered"
										value={formNuevo.telefono}
										onChange={(e) => setFormNuevo((p) => ({ ...p, telefono: e.target.value }))}
									/>
								</div>
							</div>

							<div className="form-control">
								<label className="label"><span className="label-text">Correo *</span></label>
								<input
									type="email"
									className="input input-bordered"
									value={formNuevo.email}
									onChange={(e) => setFormNuevo((p) => ({ ...p, email: e.target.value }))}
									required
								/>
							</div>

							<div className="form-control">
								<label className="label"><span className="label-text">Rol *</span></label>
								<select
									className="select select-bordered"
									value={formNuevo.rol}
									onChange={(e) => setFormNuevo((p) => ({ ...p, rol: e.target.value }))}
								>
									{ROLES.map((r) => (
										<option key={r} value={r}>{r}</option>
									))}
								</select>
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

export default Usuarios;
