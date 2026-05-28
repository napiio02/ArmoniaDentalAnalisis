import { useState, useEffect } from "react";
import { Link } from "react-router";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Pagination from "../../components/Paginacion";
import { Search, Plus, Package, AlertTriangle, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

const API_URL = "http://localhost:3000/v1/insumos";

const CATEGORIAS = [
	"Protección",
	"Anestesia",
	"Materiales restaurativos",
	"Cirugía",
	"Instrumental",
	"Prevención",
	"Ortodoncia",
	"Diagnóstico",
];

const Inventario = () => {
	const [insumos, setInsumos] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);
	const [busqueda, setBusqueda] = useState("");
	const [categoriaFiltro, setCategoriaFiltro] = useState("todo");
	const [stockFiltro, setStockFiltro] = useState("todo");
	const [paginaActual, setPaginaActual] = useState(1);

	const insumosPorPagina = 10;

	// ── Cargar insumos ──
	useEffect(() => {
		cargarInsumos();
	}, []);

	const cargarInsumos = async () => {
		try {
			setCargando(true);
			setError(null);
			const { data } = await axios.get(API_URL);
			setInsumos(data);
		} catch (err) {
			setError("No se pudieron cargar los insumos.");
		} finally {
			setCargando(false);
		}
	};

	// ── Filtros ──
	const insumosFiltrados = insumos.filter((i) => {
		const term = busqueda.toLowerCase();
		const coincideBusqueda =
			!busqueda ||
			i.nombre.toLowerCase().includes(term) ||
			i.codigo.toLowerCase().includes(term) ||
			i.categoria.toLowerCase().includes(term) ||
			(i.proveedor || "").toLowerCase().includes(term);

		const coincideCategoria =
			categoriaFiltro === "todo" || i.categoria === categoriaFiltro;

		const coincideStock =
			stockFiltro === "todo" ||
			(stockFiltro === "bajo" && i.activo && i.stock_actual <= i.stock_minimo) ||
			(stockFiltro === "ok" && i.stock_actual > i.stock_minimo);

		return coincideBusqueda && coincideCategoria && coincideStock;
	});

	// ── Toggle activo/inactivo ──
	const toggleActivo = async (id) => {
		try {
			const { data } = await axios.patch(`${API_URL}/${id}/status`);
			setInsumos((prev) => prev.map((i) => (i._id === id ? data : i)));
		} catch (err) {
			alert("Error al cambiar el estado del insumo.");
		}
	};

	// ── Paginación ──
	const totalPaginas = Math.ceil(insumosFiltrados.length / insumosPorPagina);
	const indicePrimero = (paginaActual - 1) * insumosPorPagina;
	const insumosActuales = insumosFiltrados.slice(
		indicePrimero,
		indicePrimero + insumosPorPagina
	);

	const insumosStockBajo = insumos.filter(
		(i) => i.activo && i.stock_actual <= i.stock_minimo
	).length;

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">

					{/* Encabezado */}
					<div className="mb-8">
						<h2 className="text-3xl font-bold text-gray-800 mb-2">Inventario</h2>
						<div className="flex justify-between items-center mb-4">
							<p className="text-gray-600">Gestión de insumos médicos de la clínica</p>
							<Link to="/inventario-nuevo" className="btn btn-secondary">
								<Plus size={16} /> Nuevo Insumo
							</Link>
						</div>

						{insumosStockBajo > 0 && (
							<div className="alert alert-warning mb-4">
								<AlertTriangle className="w-5 h-5" />
								<span>
									<strong>{insumosStockBajo} insumo(s)</strong> con stock bajo. Requieren reabastecimiento.
								</span>
							</div>
						)}

						{/* Filtros */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
							<label className="input input-bordered flex items-center gap-2">
								<Search className="h-4 w-4 opacity-70" />
								<input
									type="text"
									className="grow"
									placeholder="Buscar insumo..."
									value={busqueda}
									onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
								/>
							</label>
							<select
								className="select select-bordered w-full"
								value={categoriaFiltro}
								onChange={(e) => { setCategoriaFiltro(e.target.value); setPaginaActual(1); }}
							>
								<option value="todo">Todas las categorías</option>
								{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
							</select>
							<select
								className="select select-bordered w-full"
								value={stockFiltro}
								onChange={(e) => { setStockFiltro(e.target.value); setPaginaActual(1); }}
							>
								<option value="todo">Todo el stock</option>
								<option value="bajo">Stock bajo </option>
								<option value="ok">Stock OK </option>
							</select>
						</div>
					</div>

					{/* Tabla */}
					<div className="overflow-x-auto">
						{cargando ? (
							<div className="text-center py-8">
								<span className="loading loading-spinner loading-lg text-primary" />
							</div>
						) : error ? (
							<div className="alert alert-error">
								<span>{error}</span>
								<button className="btn btn-sm ml-2" onClick={cargarInsumos}>
									Reintentar
								</button>
							</div>
						) : insumosFiltrados.length === 0 ? (
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
											<th className="text-center">Acciones</th>
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
													<span className={`font-bold ${
														insumo.stock_actual <= insumo.stock_minimo
															? "text-red-600"
															: insumo.stock_actual <= insumo.stock_minimo * 2
															? "text-amber-500"
															: "text-green-600"
													}`}>
														{insumo.stock_actual}
													</span>
												</td>
												<td className="text-gray-500">{insumo.stock_minimo}</td>
												<td className="text-sm text-gray-600">{insumo.unidad}</td>
												<td className="text-sm text-gray-600">{insumo.proveedor}</td>
												<td>
													<span className={`badge ${insumo.activo ? "badge-primary" : "badge-error"}`}>
														{insumo.activo ? "Activo" : "Inactivo"}
													</span>
												</td>
												<td className="text-center">
													<div className="flex gap-2 justify-center">
														<Link
															to={`/inventario-editar/${insumo._id}`}
															className="btn btn-sm btn-outline btn-neutral"
															title="Editar stock"
														>
															<Pencil size={14} />
														</Link>
														<button
															onClick={() => toggleActivo(insumo._id)}
															className={`btn btn-sm btn-outline ${
																insumo.activo ? "btn-error" : "btn-success"
															}`}
															title={insumo.activo ? "Desactivar" : "Activar"}
														>
															{insumo.activo ? (
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
		</div>
	);
};

export default Inventario;
