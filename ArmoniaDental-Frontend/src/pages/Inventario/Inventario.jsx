import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import Sidebar from "../../components/Sidebar";
import axios from "axios";


const API_URL = "https://armoniadentalanalisis.onrender.com/v1/insumos";

const CATEGORIAS = [
	"Protección", "Anestesia", "Materiales restaurativos",
	"Cirugía", "Instrumental", "Prevención", "Ortodoncia", "Diagnóstico",
];

// ─── Inventario ─────
const Inventario = () => {
	const [insumos, setInsumos] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);
	const [busqueda, setBusqueda] = useState("");
	const [categoriaFiltro, setCategoriaFiltro] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("");
	const [paginaActual, setPaginaActual] = useState(1);
	const insumosPorPagina = 10;

	useEffect(() => {
		cargarInsumos();
	}, []);

	const cargarInsumos = async () => {
		try {
			setCargando(true);
			setError(null);
			const { data } = await axios.get(API_URL);
			setInsumos(data);
		} catch {
			setError("No se pudieron cargar los insumos.");
		} finally {
			setCargando(false);
		}
	};

	const toggleActivo = async (id) => {
		try {
			const { data } = await axios.patch(`${API_URL}/${id}/status`);
			setInsumos((prev) => prev.map((i) => (i._id === id ? data : i)));
		} catch {
			alert("Error al cambiar el estado.");
		}
	};

	const insumosFiltrados = insumos.filter((i) => {
		const term = busqueda.toLowerCase();
		const matchBusqueda = !busqueda ||
			i.nombre?.toLowerCase().includes(term) ||
			i.codigo?.toLowerCase().includes(term) ||
			i.categoria?.toLowerCase().includes(term) ||
			(i.proveedor || "").toLowerCase().includes(term);
		const matchCat = !categoriaFiltro || i.categoria === categoriaFiltro;
		const matchEstado =
			!estadoFiltro ||
			(estadoFiltro === "activo" && i.activo) ||
			(estadoFiltro === "inactivo" && !i.activo) ||
			(estadoFiltro === "bajo" && i.activo && i.stock_actual <= i.stock_minimo);
		return matchBusqueda && matchCat && matchEstado;
	});

	const totalPaginas = Math.ceil(insumosFiltrados.length / insumosPorPagina);
	const indicePrimero = (paginaActual - 1) * insumosPorPagina;
	const insumosActuales = insumosFiltrados.slice(indicePrimero, indicePrimero + insumosPorPagina);
	const stockBajoCount = insumos.filter((i) => i.activo && i.stock_actual <= i.stock_minimo).length;

	const getStockColor = (insumo) => {
		if (insumo.stock_actual <= insumo.stock_minimo) return "text-[#ba1a1a] font-bold";
		if (insumo.stock_actual <= insumo.stock_minimo * 2) return "text-[#855300] font-bold";
		return "text-[#006b5f] font-bold";
	};

	const formatVencimiento = (fecha) => {
		if (!fecha) return null;
		return new Date(
			new Date(fecha).toISOString().split("T")[0] + "T12:00:00"
		).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
	};

	return (
		<div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
			<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
			<Sidebar activeItem="inventario" />

			<main className="flex-1 h-screen overflow-y-auto p-8">
				<div className="max-w-screen-2xl mx-auto">

					{/* Header */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
						<div>
							<h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">Inventario</h2>
							<p className="text-sm text-[#3f484e] mt-1">Suministros de la Clínica · Monitorea y reabastecer equipo dental y consumibles.</p>
						</div>
						<Link to="/inventario-nuevo"
							className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
							<span className="material-symbols-outlined text-[18px]">add</span>
							Nuevo Artículo
						</Link>
					</div>

					{/* Alerta stock bajo */}
					{stockBajoCount > 0 && (
						<div className="bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-xl px-5 py-3 flex items-center gap-3 mb-5">
							<span className="material-symbols-outlined text-[#855300]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
							<p className="text-sm text-[#151c27]">
								<span className="font-bold">Alerta de Stock Bajo:</span> {stockBajoCount} artículos están por debajo de su umbral mínimo. Considera realizar un pedido hoy.
							</p>
							<button onClick={() => setEstadoFiltro("bajo")} className="ml-auto text-[#006686] text-xs font-semibold hover:underline whitespace-nowrap">
								Revisar Artículos
							</button>
						</div>
					)}

					{/* Filtros */}
					<div className="bg-white border border-[#bec8ce] rounded-xl p-4 mb-5">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="relative">
								<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e] text-[18px]">search</span>
								<input
									type="text"
									placeholder="Buscar por Código o Nombre..."
									value={busqueda}
									onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
									className="w-full pl-10 pr-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white"
								/>
							</div>
							<select
								value={categoriaFiltro}
								onChange={(e) => { setCategoriaFiltro(e.target.value); setPaginaActual(1); }}
								className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
							>
								<option value="">Todas las Categorías</option>
								{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
							</select>
							<select
								value={estadoFiltro}
								onChange={(e) => { setEstadoFiltro(e.target.value); setPaginaActual(1); }}
								className="w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27]"
							>
								<option value="">Todos los Estados</option>
								<option value="activo">Activo</option>
								<option value="inactivo">Inactivo</option>
								<option value="bajo">Stock bajo</option>
							</select>
						</div>
					</div>

					{/* Tabla */}
					<div className="bg-white border border-[#bec8ce] rounded-xl overflow-hidden mb-6">
						<div className="overflow-x-auto">
							{cargando ? (
								<div className="flex justify-center items-center py-16">
									<span className="loading loading-spinner loading-lg text-[#006686]" />
								</div>
							) : error ? (
								<div className="flex items-center justify-center gap-3 py-12 text-[#ba1a1a] text-sm">
									<span className="material-symbols-outlined">error</span>
									{error}
									<button onClick={cargarInsumos} className="underline font-semibold ml-2">Reintentar</button>
								</div>
							) : (
								<table className="w-full text-left border-collapse">
									<thead>
										<tr className="bg-[#f0f3ff] border-b border-[#bec8ce]">
											{["CÓDIGO", "NOMBRE", "CATEGORÍA", "STOCK", "MÍN", "UNIDAD", "PROVEEDOR", "VENCIMIENTO", "ESTADO", "ACCIONES"].map((h) => (
												<th key={h} className="px-5 py-3 text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider whitespace-nowrap">{h}</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-[#bec8ce]/40">
										{insumosActuales.length === 0 ? (
											<tr>
												<td colSpan={10} className="text-center py-12 text-[#3f484e] text-sm">
													<span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">inventory_2</span>
													No se encontraron insumos
												</td>
											</tr>
										) : insumosActuales.map((insumo) => (
											<tr key={insumo._id}
												className={`hover:bg-[#e7eefe]/30 transition-colors ${!insumo.activo ? "opacity-60" : ""}`}>
												<td className="px-5 py-4 text-sm text-[#151c27] font-mono">{insumo.codigo}</td>
												<td className="px-5 py-4 text-sm font-semibold text-[#151c27]">{insumo.nombre}</td>
												<td className="px-5 py-4 text-sm text-[#3f484e]">{insumo.categoria}</td>
												<td className="px-5 py-4 text-sm text-[#3f484e]"><span className={`text-sm ${getStockColor(insumo)}`}>{insumo.stock_actual}</span></td>
												<td className="px-5 py-4 text-sm text-[#3f484e]">{insumo.stock_minimo}</td>
												<td className="px-5 py-4 text-sm text-[#3f484e]">{insumo.unidad}</td>
												<td className="px-5 py-4 text-sm text-[#3f484e]">{insumo.proveedor || "—"}</td>
												<td className="px-5 py-4 text-sm text-[#3f484e]">{formatVencimiento(insumo.fecha_vencimiento) || <span className="text-[#bec8ce]">—</span>}</td>
												<td className="px-5 py-4">
													{insumo.activo ? (
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6df5e120] text-[#006b5f] border border-[#6df5e1]/30">Activo</span>
													) : (
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dce2f3] text-[#3f484e] border border-[#bec8ce]">Inactivo</span>
													)}
												</td>
												<td className="px-5 py-4">
													<div className="flex justify-center gap-2">
														<Link to={`/inventario-editar/${insumo._id}`}
															className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-all" title="Editar">
															<span className="material-symbols-outlined text-[18px]">edit</span>
														</Link>
														<Link to={`/inventario-entrada/${insumo._id}`}
                                                            className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-all" title="Registrar entrada">
                                                            <span className="material-symbols-outlined text-[18px]">move_to_inbox</span>
                                                        </Link>
														<Link to={`/inventario-salida/${insumo._id}`}
                                                            className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#ba1a1a] hover:text-[#ba1a1a] transition-all" title="Registrar salida">
                                                            <span className="material-symbols-outlined text-[18px]">outbox</span>
                                                        </Link>
														<button onClick={() => toggleActivo(insumo._id)}
															className="p-1.5 rounded border border-[#bec8ce] text-[#3f484e] hover:border-[#006686] hover:text-[#006686] transition-all"
															title={insumo.activo ? "Desactivar" : "Activar"}>
															<span className="material-symbols-outlined text-[18px]">{insumo.activo ? "toggle_on" : "toggle_off"}</span>
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>

						{/* Paginación */}
						{!cargando && !error && insumosFiltrados.length > 0 && (
							<div className="px-5 py-3 flex items-center justify-between bg-[#f0f3ff] border-t border-[#bec8ce]">
								<span className="text-xs font-semibold text-[#3f484e]">
									Mostrando {indicePrimero + 1} a {Math.min(indicePrimero + insumosPorPagina, insumosFiltrados.length)} de {insumosFiltrados.length} entradas
								</span>
								<div className="flex items-center gap-1">
									<button
										onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
										disabled={paginaActual === 1}
										className="p-1 rounded hover:bg-[#dce2f3] transition-colors disabled:opacity-30"
									>
										<span className="material-symbols-outlined">chevron_left</span>
									</button>
									{Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => i + 1).map((n) => (
										<button key={n} onClick={() => setPaginaActual(n)}
											className={`w-8 h-8 rounded text-xs font-semibold flex items-center justify-center transition-colors ${paginaActual === n ? "bg-[#006686] text-white" : "hover:bg-[#dce2f3] text-[#3f484e]"
												}`}>
											{n}
										</button>
									))}
									<button
										onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
										disabled={paginaActual >= totalPaginas}
										className="p-1 rounded hover:bg-[#dce2f3] transition-colors disabled:opacity-30"
									>
										<span className="material-symbols-outlined">chevron_right</span>
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Stats bento */}
					{!cargando && !error && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{[
								{ label: "Total Artículos", value: insumos.length, sub: "+12 este mes", subColor: "text-[#006b5f]", icon: "category", iconColor: "text-[#006686]" },
								{ label: "Pedidos Pendientes", value: 8, sub: "3 llegan hoy", subColor: "text-[#3f484e]", icon: "shopping_cart", iconColor: "text-[#006686]" },
								{ label: "Proveedores Activos", value: 14, sub: "Suministro verificado", subColor: "text-[#3f484e]", icon: "local_shipping", iconColor: "text-[#006686]" },
								{ label: "Sin Stock", value: insumos.filter(i => i.stock_actual === 0).length, sub: "Acción requerida", subColor: "text-[#ba1a1a] font-semibold", icon: "dangerous", iconColor: "text-[#ba1a1a]", valueColor: "text-[#ba1a1a]" },
							].map((card) => (
								<div key={card.label} className="bg-white border border-[#bec8ce] p-4 rounded-xl shadow-sm">
									<div className="flex justify-between items-start mb-2">
										<span className="text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">{card.label}</span>
										<span className={`material-symbols-outlined ${card.iconColor}`}>{card.icon}</span>
									</div>
									<div className={`text-[22px] font-semibold ${card.valueColor || "text-[#151c27]"}`}>{card.value}</div>
									<div className={`mt-1 text-[11px] font-semibold ${card.subColor}`}>{card.sub}</div>
								</div>
							))}
						</div>
					)}
				</div>
			</main>

			{/* FAB */}
			<button className="fixed bottom-6 right-6 w-14 h-14 bg-[#006686] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50">
				<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>barcode_scanner</span>
			</button>
		</div>
	);
};

export default Inventario;
