import Navbar from "../components/Navbar";
import { CITAS, PACIENTES, COMPROBANTES, MARCAS, INSUMOS } from "../data/mockData";
import { BarChart2, TrendingUp, Calendar, Users, AlertTriangle, FileText } from "lucide-react";
import { useState } from "react";

const Reportes = () => {
	const [toast, setToast] = useState(false);


	// Tratamientos más frecuentes
	const frecuenciaTratamiento = CITAS.reduce((acc, c) => {
		acc[c.tipo] = (acc[c.tipo] || 0) + 1;
		return acc;
	}, {});
	const tratamientosOrdenados = Object.entries(frecuenciaTratamiento)
		.sort((a, b) => b[1] - a[1]);

	// Estado de citas
	const estadoCitas = CITAS.reduce((acc, c) => {
		acc[c.estado] = (acc[c.estado] || 0) + 1;
		return acc;
	}, {});

	// Ingresos por comprobante
	const ingresoTotal = COMPROBANTES.reduce((acc, c) => acc + c.monto, 0);
	const ingresosPorTipo = COMPROBANTES.reduce((acc, c) => {
		acc[c.tipo] = (acc[c.tipo] || 0) + c.monto;
		return acc;
	}, {});

	// Horas trabajadas por empleado
	const horasPorEmpleado = MARCAS.reduce((acc, m) => {
		const nombre = m.usuario_id.nombre;
		acc[nombre] = (acc[nombre] || 0) + m.horas_trabajadas;
		return acc;
	}, {});

	// Insumos en estado crítico
	const insumosStockBajo = INSUMOS.filter((i) => i.activo && i.stock_actual <= i.stock_minimo);

	const maxTratamiento = Math.max(...tratamientosOrdenados.map((t) => t[1]));

	const COLORES_ESTADO = {
		Programada: "bg-yellow-400",
		Confirmada: "bg-sky-400",
		Atendida: "bg-green-500",
		Cancelada: "bg-red-400",
		"No asistió": "bg-gray-400",
		"En atención": "bg-blue-400",
	};

	const generarReporte = () => {
		console.log("Generando reporte...");
		setToast(true);

		setTimeout(() => {
			setToast(false);
		}, 3000);
	};

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
						<div>
							<h2 className="text-3xl font-bold text-gray-800 mb-2">Reportes y Estadísticas</h2>
							<p className="text-gray-600">
								Resumen del desempeño clínico y administrativo de Armonía Dental
							</p>
						</div>

						<button
							type="button"
							className="btn btn-secondary"
							onClick={generarReporte}
						>
							<FileText size={18} />
							Generar reporte
						</button>
					</div>

					{/* KPIs */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						<div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
							<div className="flex items-center gap-3 mb-2">
								<Users className="w-5 h-5 text-primary" />
								<p className="text-sm text-gray-600">Pacientes registrados</p>
							</div>
							<p className="text-3xl font-bold">{PACIENTES.length}</p>
							<p className="text-xs text-gray-400 mt-1">
								{PACIENTES.filter((p) => p.activo).length} activos
							</p>
						</div>
						<div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
							<div className="flex items-center gap-3 mb-2">
								<Calendar className="w-5 h-5 text-primary" />
								<p className="text-sm text-gray-600">Total de citas</p>
							</div>
							<p className="text-3xl font-bold">{CITAS.length}</p>
							<p className="text-xs text-gray-400 mt-1">
								{CITAS.filter((c) => c.estado === "Cancelada").length} canceladas
							</p>
						</div>
						<div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
							<div className="flex items-center gap-3 mb-2">
								<TrendingUp className="w-5 h-5 text-primary" />
								<p className="text-sm text-gray-600">Ingresos del mes</p>
							</div>
							<p className="text-2xl font-bold">₡{ingresoTotal.toLocaleString("es-CR")}</p>
							<p className="text-xs text-green-600 mt-1">+12% vs mes anterior</p>
						</div>
						<div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
							<div className="flex items-center gap-3 mb-2">
								<AlertTriangle className="w-5 h-5 text-red-500" />
								<p className="text-sm text-gray-600">Insumos críticos</p>
							</div>
							<p className="text-3xl font-bold text-red-500">{insumosStockBajo.length}</p>
							<p className="text-xs text-gray-400 mt-1">Requieren reabastecimiento</p>
						</div>
					</div>

					<div className="grid lg:grid-cols-2 gap-6 mb-6">
						{/* Tratamientos más frecuentes */}
						<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
							<h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
								<BarChart2 className="w-5 h-5 text-primary" />
								Tratamientos más frecuentes
							</h3>
							<div className="space-y-3">
								{tratamientosOrdenados.map(([tipo, cantidad]) => (
									<div key={tipo}>
										<div className="flex justify-between text-sm mb-1">
											<span className="text-gray-700">{tipo}</span>
											<span className="font-semibold">{cantidad} citas</span>
										</div>
										<div className="w-full bg-gray-100 rounded-full h-2">
											<div
												className="bg-primary rounded-full h-2 transition-all"
												style={{
													width: `${(cantidad / maxTratamiento) * 100}%`,
												}}
											></div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Estado de citas */}
						<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
							<h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
								<Calendar className="w-5 h-5 text-primary" />
								Estado de Citas
							</h3>
							<div className="space-y-3">
								{Object.entries(estadoCitas).map(([estado, cantidad]) => (
									<div key={estado} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span
												className={`w-3 h-3 rounded-full ${
													COLORES_ESTADO[estado] || "bg-gray-400"
												}`}
											></span>
											<span className="text-sm text-gray-700">{estado}</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="font-semibold">{cantidad}</span>
											<span className="text-xs text-gray-400">
												({Math.round((cantidad / CITAS.length) * 100)}%)
											</span>
										</div>
									</div>
								))}
							</div>

							<div className="mt-4">
								<div className="flex w-full h-4 rounded-full overflow-hidden">
									{Object.entries(estadoCitas).map(([estado, cantidad]) => (
										<div
											key={estado}
											className={`${COLORES_ESTADO[estado] || "bg-gray-400"}`}
											style={{ width: `${(cantidad / CITAS.length) * 100}%` }}
											title={`${estado}: ${cantidad}`}
										></div>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="grid lg:grid-cols-2 gap-6">
						{/* Horas trabajadas */}
						<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
							<h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
								<Users className="w-5 h-5 text-primary" />
								Horas trabajadas por empleado (semana)
							</h3>
							<div className="space-y-3">
								{Object.entries(horasPorEmpleado).map(([nombre, horas]) => (
									<div key={nombre}>
										<div className="flex justify-between text-sm mb-1">
											<span className="text-gray-700 truncate">{nombre}</span>
											<span className="font-semibold">{horas.toFixed(1)}h</span>
										</div>
										<div className="w-full bg-gray-100 rounded-full h-2">
											<div
												className="bg-sky-400 rounded-full h-2"
												style={{ width: `${Math.min((horas / 45) * 100, 100)}%` }}
											></div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Ingresos por tipo de comprobante */}
						<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
							<h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
								<TrendingUp className="w-5 h-5 text-primary" />
								Ingresos por tipo de servicio
							</h3>
							<div className="space-y-3">
								{Object.entries(ingresosPorTipo).map(([tipo, monto]) => (
									<div
										key={tipo}
										className="flex justify-between items-center border-b border-gray-100 pb-2"
									>
										<span className="text-sm text-gray-700">{tipo}</span>
										<span className="font-semibold text-green-600">
											₡{monto.toLocaleString("es-CR")}
										</span>
									</div>
								))}
								<div className="flex justify-between items-center pt-1">
									<span className="font-semibold text-gray-800">Total</span>
									<span className="font-bold text-gray-900 text-lg">
										₡{ingresoTotal.toLocaleString("es-CR")}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Insumos críticos */}
					{insumosStockBajo.length > 0 && (
						<div className="mt-6 bg-white border border-red-200 rounded-xl p-6 shadow-sm">
							<h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
								<AlertTriangle className="w-5 h-5" />
								Insumos con stock crítico
							</h3>
							<div className="overflow-x-auto">
								<table className="table table-sm">
									<thead>
										<tr>
											<th>Insumo</th>
											<th>Categoría</th>
											<th>Stock actual</th>
											<th>Stock mínimo</th>
											<th>Proveedor</th>
										</tr>
									</thead>
									<tbody>
										{insumosStockBajo.map((ins) => (
											<tr key={ins._id}>
												<td className="font-medium">{ins.nombre}</td>
												<td>
													<span className="badge badge-outline badge-sm">
														{ins.categoria}
													</span>
												</td>
												<td>
													<span className="font-bold text-red-600">
														{ins.stock_actual} {ins.unidad}
													</span>
												</td>
												<td className="text-gray-500">{ins.stock_minimo}</td>
												<td className="text-gray-600">{ins.proveedor}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>
			{toast && (
				<div className="toast toast-bottom toast-end z-50">
					<div className="bg-white border border-gray-200 rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px] max-w-[420px] animate-fade-in">
						
						{/* Icono grande */}
						<div className="bg-green-100 text-green-600 p-3 rounded-xl">
							<FileText size={22} />
						</div>

						{/* Texto */}
						<div className="flex-1">
							<p className="text-base font-semibold text-gray-800">
								Reporte generado correctamente
							</p>
						</div>

						{/* Botón cerrar */}
						<button
							onClick={() => setToast(false)}
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

export default Reportes;