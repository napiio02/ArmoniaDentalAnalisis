import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Pagination from "../components/Paginacion";
import { Search, Plus, Package, AlertTriangle, X } from "lucide-react";
import { INSUMOS } from "../data/mockData";

const Inventario = () => {
	const [insumos, setInsumos] = useState(INSUMOS);
	const [insumosFiltrados, setInsumosFiltrados] = useState(INSUMOS);
	const [busqueda, setBusqueda] = useState("");
	const [categoriaFiltro, setCategoriaFiltro] = useState("todo");
	const [stockFiltro, setStockFiltro] = useState("todo");
	const [paginaActual, setPaginaActual] = useState(1);
	const [mostrarModal, setMostrarModal] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [formNuevo, setFormNuevo] = useState({
		nombre: "",
		categoria: "",
		stock_actual: "",
		stock_minimo: "",
		unidad: "",
		proveedor: "",
	});

	const insumosPorPagina = 10;

	const categorias = [...new Set(INSUMOS.map((i) => i.categoria))];

	useEffect(() => {
		filtrar();
		setPaginaActual(1);
	}, [busqueda, categoriaFiltro, stockFiltro, insumos]);

	const filtrar = () => {
		let filtered = [...insumos];

		if (busqueda) {
			const term = busqueda.toLowerCase();
			filtered = filtered.filter(
				(i) =>
					i.nombre.toLowerCase().includes(term) ||
					i.codigo.toLowerCase().includes(term) ||
					i.categoria.toLowerCase().includes(term) ||
					i.proveedor.toLowerCase().includes(term)
			);
		}

		if (categoriaFiltro !== "todo") {
			filtered = filtered.filter((i) => i.categoria === categoriaFiltro);
		}

		if (stockFiltro === "bajo") {
			filtered = filtered.filter(
				(i) => i.activo && i.stock_actual <= i.stock_minimo
			);
		} else if (stockFiltro === "ok") {
			filtered = filtered.filter((i) => i.stock_actual > i.stock_minimo);
		}

		setInsumosFiltrados(filtered);
	};

	const handleGuardar = (e) => {
		e.preventDefault();
		setGuardando(true);
		setTimeout(() => {
			const nuevo = {
				_id: `i${Date.now()}`,
				codigo: `INS-${String(insumos.length + 1).padStart(3, "0")}`,
				...formNuevo,
				stock_actual: Number(formNuevo.stock_actual),
				stock_minimo: Number(formNuevo.stock_minimo),
				activo: true,
			};
			setInsumos((prev) => [...prev, nuevo]);
			setFormNuevo({ nombre: "", categoria: "", stock_actual: "", stock_minimo: "", unidad: "", proveedor: "" });
			setMostrarModal(false);
			setGuardando(false);
		}, 600);
	};

	const insumosStockBajo = insumos.filter(
		(i) => i.activo && i.stock_actual <= i.stock_minimo
	).length;

	const totalPaginas = Math.ceil(insumosFiltrados.length / insumosPorPagina);
	const indiceUltimo = paginaActual * insumosPorPagina;
	const indicePrimero = indiceUltimo - insumosPorPagina;
	const insumosActuales = insumosFiltrados.slice(indicePrimero, indiceUltimo);

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-gray-800 mb-2">Inventario</h2>
						<div className="flex justify-between items-center mb-4">
							<p className="text-gray-600">
								Gestión de insumos médicos de la clínica
							</p>
							<button
								className="btn btn-secondary"
								onClick={() => setMostrarModal(true)}
							>
								<Plus size={16} />
								Nuevo Insumo
							</button>
						</div>

						{insumosStockBajo > 0 && (
							<div className="alert alert-warning mb-4">
								<AlertTriangle className="w-5 h-5" />
								<span>
									<strong>{insumosStockBajo} insumo(s)</strong> con stock bajo o agotado.
									Requieren reabastecimiento.
								</span>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
							<div className="md:col-span-1">
								<label className="input input-bordered flex items-center gap-2">
									<Search className="h-4 w-4 opacity-70" />
									<input
										type="text"
										className="grow"
										placeholder="Buscar insumo..."
										value={busqueda}
										onChange={(e) => setBusqueda(e.target.value)}
									/>
								</label>
							</div>
							<div>
								<select
									className="select select-bordered w-full"
									value={categoriaFiltro}
									onChange={(e) => setCategoriaFiltro(e.target.value)}
								>
									<option value="todo">Todas las categorías</option>
									{categorias.map((c) => (
										<option key={c} value={c}>{c}</option>
									))}
								</select>
							</div>
							<div>
								<select
									className="select select-bordered w-full"
									value={stockFiltro}
									onChange={(e) => setStockFiltro(e.target.value)}
								>
									<option value="todo">Todo el stock</option>
									<option value="bajo">Stock bajo ⚠️</option>
									<option value="ok">Stock OK ✅</option>
								</select>
							</div>
						</div>
					</div>

					<div className="overflow-x-auto">
						{insumosFiltrados.length === 0 ? (
							<div className="text-center py-8">
								<Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
								<p className="text-gray-500">No se encontraron insumos</p>
							</div>
						) : (
							<>
								<table className="table">
									<thead>
										<tr>
											<th></th>
											<th>Código</th>
											<th>Nombre</th>
											<th>Categoría</th>
											<th>Stock</th>
											<th>Mínimo</th>
											<th>Unidad</th>
											<th>Proveedor</th>
											<th>Estado</th>
										</tr>
									</thead>
									<tbody>
										{insumosActuales.map((insumo, index) => (
											<tr
												key={insumo._id}
												className={
													insumo.activo && insumo.stock_actual <= insumo.stock_minimo
														? "bg-red-50"
														: ""
												}
											>
												<th>{indicePrimero + index + 1}</th>
												<td className="font-mono text-sm">{insumo.codigo}</td>
												<td className="font-medium">
													<div className="flex items-center gap-2">
														{insumo.activo && insumo.stock_actual <= insumo.stock_minimo && (
															<AlertTriangle className="w-4 h-4 text-amber-500" />
														)}
														{insumo.nombre}
													</div>
												</td>
												<td>
													<span className="badge badge-outline badge-sm">
														{insumo.categoria}
													</span>
												</td>
												<td>
													<span
														className={`font-bold ${
															insumo.stock_actual <= insumo.stock_minimo
																? "text-red-600"
																: insumo.stock_actual <= insumo.stock_minimo * 2
																? "text-amber-500"
																: "text-green-600"
														}`}
													>
														{insumo.stock_actual}
													</span>
												</td>
												<td className="text-gray-500">{insumo.stock_minimo}</td>
												<td className="text-sm text-gray-600">{insumo.unidad}</td>
												<td className="text-sm text-gray-600">{insumo.proveedor}</td>
												<td>
													{insumo.activo ? (
														<span className="badge badge-primary">Activo</span>
													) : (
														<span className="badge badge-error">Inactivo</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>

								<Pagination
									paginaActual={paginaActual}
									totalPaginas={totalPaginas}
									onCambioPagina={setPaginaActual}
									totalItems={insumosFiltrados.length}
									itemsPorPagina={insumosPorPagina}
								/>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Modal nuevo insumo */}
			{mostrarModal && (
				<dialog className="modal modal-open">
					<div className="modal-box max-w-lg">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Nuevo Insumo</h3>
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
									<span className="label-text">Nombre del insumo *</span>
								</label>
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
									<label className="label">
										<span className="label-text">Categoría *</span>
									</label>
									<input
										type="text"
										className="input input-bordered"
										placeholder="Ej: Anestesia"
										value={formNuevo.categoria}
										onChange={(e) => setFormNuevo((p) => ({ ...p, categoria: e.target.value }))}
										required
									/>
								</div>
								<div className="form-control">
									<label className="label">
										<span className="label-text">Unidad *</span>
									</label>
									<input
										type="text"
										className="input input-bordered"
										placeholder="Ej: Cajas"
										value={formNuevo.unidad}
										onChange={(e) => setFormNuevo((p) => ({ ...p, unidad: e.target.value }))}
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Stock actual *</span>
									</label>
									<input
										type="number"
										min="0"
										className="input input-bordered"
										value={formNuevo.stock_actual}
										onChange={(e) => setFormNuevo((p) => ({ ...p, stock_actual: e.target.value }))}
										required
									/>
								</div>
								<div className="form-control">
									<label className="label">
										<span className="label-text">Stock mínimo *</span>
									</label>
									<input
										type="number"
										min="0"
										className="input input-bordered"
										value={formNuevo.stock_minimo}
										onChange={(e) => setFormNuevo((p) => ({ ...p, stock_minimo: e.target.value }))}
										required
									/>
								</div>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Proveedor</span>
								</label>
								<input
									type="text"
									className="input input-bordered"
									value={formNuevo.proveedor}
									onChange={(e) => setFormNuevo((p) => ({ ...p, proveedor: e.target.value }))}
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
										"Guardar Insumo"
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

export default Inventario;
