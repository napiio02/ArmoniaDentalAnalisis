import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { Users, Calendar, DollarSign, Package, Clock, FileText } from "lucide-react";
import { PACIENTES, CITAS, INSUMOS, COMPROBANTES } from "../data/mockData";

const Home = () => {
	const pacientesActivos = PACIENTES.filter((p) => p.activo).length;
	const citasMes = CITAS.filter((c) => {
		const fecha = new Date(c.fecha_hora);
		return fecha.getMonth() === 3 && fecha.getFullYear() === 2026;
	}).length;
	const ingresosMes = COMPROBANTES.reduce((acc, c) => acc + c.monto, 0);
	const insumosStockBajo = INSUMOS.filter(
		(i) => i.activo && i.stock_actual <= i.stock_minimo
	).length;

	const citasHoy = CITAS.filter((c) => {
		const fecha = new Date(c.fecha_hora);
		return (
			fecha.getDate() === 16 &&
			fecha.getMonth() === 3 &&
			fecha.getFullYear() === 2026
		);
	});

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="mb-8 px-8">
					<h2 className="text-3xl font-bold text-gray-800 mb-2">Estadísticas</h2>
					<p className="text-gray-600 mb-4">
						Resumen general del desempeño de la clínica
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-7">
						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6">
							<div className="flex items-start justify-between">
								<div>
									<p className="text-sm text-gray-600 mb-1">Pacientes Activos</p>
									<h3 className="text-3xl font-bold text-gray-900">
										{pacientesActivos}
									</h3>
									<p className="text-xs text-gray-500 mt-1">Expediente registrado</p>
								</div>
								<div className="p-2 bg-primary/15 rounded-lg">
									<Users className="w-6 h-6 text-primary" />
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6">
							<div className="flex items-start justify-between">
								<div>
									<p className="text-sm text-gray-600 mb-1">Citas del Mes</p>
									<h3 className="text-3xl font-bold text-gray-900">{citasMes}</h3>
									<p className="text-xs text-gray-500 mt-1">Abril 2026</p>
								</div>
								<div className="p-2 bg-primary/15 rounded-lg">
									<Calendar className="w-6 h-6 text-primary" />
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6">
							<div className="flex items-start justify-between">
								<div>
									<p className="text-sm text-gray-600 mb-1">Insumos Stock Bajo</p>
									<h3 className="text-3xl font-bold text-gray-900">
										{insumosStockBajo}
									</h3>
									<p className="text-xs text-red-500 mt-1">Requieren reabastecimiento</p>
								</div>
								<div className="p-2 bg-red-100 rounded-lg">
									<Package className="w-6 h-6 text-red-500" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Citas de hoy */}
				<div className="px-8 mb-8">
					<h2 className="text-3xl font-bold text-gray-800 mb-2">Citas de Hoy</h2>
					<p className="text-gray-600 mb-4">Agenda del día – 16 de abril, 2026</p>

					{citasHoy.length === 0 ? (
						<div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
							No hay citas programadas para hoy.
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{citasHoy.map((cita) => (
								<div
									key={cita._id}
									className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 hover:shadow-md transition-shadow"
								>
									<div className="flex items-center justify-between mb-2">
										<span className="font-semibold text-gray-800">
											{new Date(cita.fecha_hora).toLocaleTimeString("es-CR", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
										<span
											className={`badge ${cita.estado === "Confirmada"
													? "bg-sky-400 border-sky-400 text-white"
													: cita.estado === "Programada"
														? "badge-warning"
														: "badge-neutral"
												}`}
										>
											{cita.estado}
										</span>
									</div>
									<p className="text-gray-700 font-medium">
										{cita.paciente_id.nombre}
									</p>
									<p className="text-sm text-gray-500">
										{cita.tipo} · {cita.motivo}
									</p>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Módulos */}
				<div className="px-8">
					<h2 className="text-3xl font-bold text-gray-800 mb-2">Módulos</h2>
					<p className="text-gray-600 mb-4">Acceso rápido a todas las funciones del sistema</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-7">
						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
							<div className="flex items-start mb-4">
								<div className="p-2 bg-primary/15 rounded-lg mr-3">
									<Users className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="text-xl font-semibold mb-2">Gestión de Pacientes</h3>
									<p className="text-sm text-gray-600">
										Administra la información y expedientes de los pacientes de la clínica
									</p>
								</div>
							</div>
							<div className="flex gap-3 mt-auto">
								<Link to={"/pacientes"} className="btn btn-secondary flex-1">
									Ver Pacientes
								</Link>
								<Link
									to={"/pacientes-nuevo"}
									className="btn btn-outline btn-secondary flex-1"
								>
									Nuevo Paciente
								</Link>
							</div>
						</div>

						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
							<div className="flex items-start mb-4">
								<div className="p-2 bg-primary/15 rounded-lg mr-3">
									<Calendar className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="text-xl font-semibold mb-2">Agenda de Citas</h3>
									<p className="text-sm text-gray-600">
										Programa y controla las citas: limpiezas, cirugías, revisiones y más
									</p>
								</div>
							</div>
							<div className="flex gap-3 mt-auto">
								<Link to={"/citas"} className="btn btn-secondary flex-1">
									Ver Citas
								</Link>
							</div>
						</div>

						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
							<div className="flex items-start mb-4">
								<div className="p-2 bg-primary/15 rounded-lg mr-3">
									<Package className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="text-xl font-semibold mb-2">Inventario</h3>
									<p className="text-sm text-gray-600">
										Controla los insumos médicos y recibe alertas cuando el stock es bajo
									</p>
								</div>
							</div>
							<div className="flex gap-3 mt-auto">
								<Link to={"/inventario"} className="btn btn-secondary flex-1">
									Ver Inventario
								</Link>
							</div>
						</div>

						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
							<div className="flex items-start mb-4">
								<div className="p-2 bg-primary/15 rounded-lg mr-3">
									<Clock className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="text-xl font-semibold mb-2">Control de Marcas</h3>
									<p className="text-sm text-gray-600">
										Registra entradas y salidas del personal y calcula horas trabajadas
									</p>
								</div>
							</div>
							<div className="flex gap-3 mt-auto">
								<Link to={"/control-marcas"} className="btn btn-secondary flex-1">
									Ver Marcas
								</Link>
							</div>
						</div>

						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
							<div className="flex items-start mb-4">
								<div className="p-2 bg-primary/15 rounded-lg mr-3">
									<FileText className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="text-xl font-semibold mb-2">Comprobantes</h3>
									<p className="text-sm text-gray-600">
										Genera constancias de atención, incapacidades y justificaciones laborales
									</p>
								</div>
							</div>
							<div className="flex gap-3 mt-auto">
								<Link to={"/comprobantes"} className="btn btn-secondary flex-1">
									Ver Comprobantes
								</Link>
							</div>
						</div>

						<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6 flex flex-col">
							<div className="flex items-start mb-4">
								<div className="p-2 bg-primary/15 rounded-lg mr-3">
									<DollarSign className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="text-xl font-semibold mb-2">Reportes</h3>
									<p className="text-sm text-gray-600">
										Visualiza estadísticas de atención, ingresos, cancelaciones y más
									</p>
								</div>
							</div>
							<div className="flex gap-3 mt-auto">
								<Link to={"/reportes"} className="btn btn-secondary flex-1">
									Ver Reportes
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
