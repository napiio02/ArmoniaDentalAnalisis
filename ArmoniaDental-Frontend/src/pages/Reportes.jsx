import { useState, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from "../components/Sidebar";
import { obtenerDatosReporte } from "../services/reporteService";

const COLORES_ESTADO = {
	"Programada":  { bar: "bg-[#ffddb8]",  dot: "bg-[#855300]" },
	"Confirmada":  { bar: "bg-[#7dd3fc]",  dot: "bg-[#006686]" },
	"Atendida":    { bar: "bg-[#6df5e1]",  dot: "bg-[#006b5f]" },
	"Cancelada":   { bar: "bg-[#ffdad6]",  dot: "bg-[#ba1a1a]" },
	"No asistió":  { bar: "bg-[#dce2f3]",  dot: "bg-[#3f484e]" },
	"En atención": { bar: "bg-[#bfc8ce]",  dot: "bg-[#3f484e]" },
};

const formatearFecha = (fecha) =>
	new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "long", year: "numeric" }).format(fecha);

const Reportes = () => {
	const [toast, setToast] = useState(null); // { tipo: "ok" | "error", mensaje }
	const [generando, setGenerando] = useState(false);

	const [pacientes, setPacientes] = useState([]);
	const [citas, setCitas] = useState([]);
	const [insumos, setInsumos] = useState([]);
	const [porEmpleado, setPorEmpleado] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [errorCarga, setErrorCarga] = useState("");

	const cargarDatos = () => {
		setCargando(true);
		setErrorCarga("");

		obtenerDatosReporte()
			.then(({ pacientes, citas, insumos, resumenMarcas }) => {
				setPacientes(pacientes);
				setCitas(citas);
				setInsumos(insumos);
				setPorEmpleado(resumenMarcas?.porEmpleado ?? []);
			})
			.catch((err) => {
				setErrorCarga(err.message || "No se pudieron cargar los datos del reporte.");
			})
			.finally(() => setCargando(false));
	};

	useEffect(() => {
		cargarDatos();
	}, []);

	const insumosStockBajo = useMemo(
		() => insumos.filter((i) => i.activo && i.stock_actual <= i.stock_minimo),
		[insumos]
	);

	const tratamientosOrdenados = useMemo(() => {
		const frecuencia = citas.reduce((acc, c) => {
			acc[c.tipo] = (acc[c.tipo] || 0) + 1;
			return acc;
		}, {});
		return Object.entries(frecuencia).sort((a, b) => b[1] - a[1]);
	}, [citas]);

	const maxTratamiento = tratamientosOrdenados.length > 0
		? Math.max(...tratamientosOrdenados.map((t) => t[1]))
		: 1;

	const estadoCitas = useMemo(
		() => citas.reduce((acc, c) => { acc[c.estado] = (acc[c.estado] || 0) + 1; return acc; }, {}),
		[citas]
	);

	const maxHoras = porEmpleado.length > 0
		? Math.max(...porEmpleado.map((e) => e.totalHoras || 0), 1)
		: 1;

	const generarReporte = () => {
		if (cargando || generando) return;

		setGenerando(true);

		try {
			const doc = new jsPDF();
			const fechaGeneracion = new Date();
			const margenX = 14;
			let cursorY = 18;

			doc.setFont("helvetica", "bold");
			doc.setFontSize(16);
			doc.setTextColor(21, 28, 39);
			doc.text("Reportes y Estadísticas – Armonía Dental", margenX, cursorY);

			cursorY += 6;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.setTextColor(63, 72, 78);
			doc.text(`Generado el ${formatearFecha(fechaGeneracion)}`, margenX, cursorY);

			cursorY += 10;

			// KPIs
			autoTable(doc, {
				startY: cursorY,
				margin: { left: margenX, right: margenX },
				head: [["Indicador", "Valor"]],
				body: [
					["Pacientes registrados", String(pacientes.length)],
					["Pacientes activos", String(pacientes.filter((p) => p.activo).length)],
					["Total de citas", String(citas.length)],
					["Citas canceladas", String(citas.filter((c) => c.estado === "Cancelada").length)],
					["Insumos con stock crítico", String(insumosStockBajo.length)],
				],
				theme: "striped",
				headStyles: { fillColor: [0, 102, 134] },
				styles: { fontSize: 9 },
			});

			// Tratamientos más frecuentes
			if (tratamientosOrdenados.length > 0) {
				autoTable(doc, {
					startY: doc.lastAutoTable.finalY + 10,
					margin: { left: margenX, right: margenX },
					head: [["Tratamiento", "Cantidad de citas"]],
					body: tratamientosOrdenados.map(([tipo, cantidad]) => [tipo, String(cantidad)]),
					theme: "striped",
					headStyles: { fillColor: [0, 102, 134] },
					styles: { fontSize: 9 },
					didDrawPage: (data) => {
						if (data.pageNumber === 1 && data.cursor) {
							doc.setFont("helvetica", "bold");
							doc.setFontSize(11);
							doc.setTextColor(21, 28, 39);
							doc.text("Tratamientos más frecuentes", margenX, data.settings.startY - 3);
						}
					},
				});
			}

			// Estado de citas
			if (citas.length > 0) {
				autoTable(doc, {
					startY: doc.lastAutoTable.finalY + 10,
					margin: { left: margenX, right: margenX },
					head: [["Estado", "Cantidad", "Porcentaje"]],
					body: Object.entries(estadoCitas).map(([estado, cantidad]) => [
						estado,
						String(cantidad),
						`${Math.round((cantidad / citas.length) * 100)}%`,
					]),
					theme: "striped",
					headStyles: { fillColor: [0, 102, 134] },
					styles: { fontSize: 9 },
					didDrawPage: (data) => {
						if (data.pageNumber === 1 && data.cursor) {
							doc.setFont("helvetica", "bold");
							doc.setFontSize(11);
							doc.setTextColor(21, 28, 39);
							doc.text("Estado de citas", margenX, data.settings.startY - 3);
						}
					},
				});
			}

			// Horas trabajadas por empleado (real, desde /marcas/resumen)
			if (porEmpleado.length > 0) {
				autoTable(doc, {
					startY: doc.lastAutoTable.finalY + 10,
					margin: { left: margenX, right: margenX },
					head: [["Empleado", "Rol", "Días trabajados", "Total de horas"]],
					body: porEmpleado.map((e) => [
						e.nombre,
						e.rol ?? "—",
						String(e.diasTrabajados ?? 0),
						`${(e.totalHoras ?? 0).toFixed(1)}h`,
					]),
					theme: "striped",
					headStyles: { fillColor: [0, 102, 134] },
					styles: { fontSize: 9 },
					didDrawPage: (data) => {
						if (data.pageNumber === 1 && data.cursor) {
							doc.setFont("helvetica", "bold");
							doc.setFontSize(11);
							doc.setTextColor(21, 28, 39);
							doc.text("Horas trabajadas por empleado", margenX, data.settings.startY - 3);
						}
					},
				});
			}

			// Insumos críticos
			if (insumosStockBajo.length > 0) {
				autoTable(doc, {
					startY: doc.lastAutoTable.finalY + 10,
					margin: { left: margenX, right: margenX },
					head: [["Insumo", "Categoría", "Stock actual", "Stock mínimo", "Proveedor"]],
					body: insumosStockBajo.map((ins) => [
						ins.nombre,
						ins.categoria,
						`${ins.stock_actual} ${ins.unidad ?? ""}`.trim(),
						String(ins.stock_minimo),
						ins.proveedor ?? "—",
					]),
					theme: "striped",
					headStyles: { fillColor: [186, 26, 26] },
					styles: { fontSize: 9 },
					didDrawPage: (data) => {
						if (data.pageNumber === 1 && data.cursor) {
							doc.setFont("helvetica", "bold");
							doc.setFontSize(11);
							doc.setTextColor(186, 26, 26);
							doc.text("Insumos con stock crítico", margenX, data.settings.startY - 3);
						}
					},
				});
			}

			const nombreArchivo = `ArmoniaDental_Reporte_${fechaGeneracion.toISOString().slice(0, 10)}.pdf`;
			doc.save(nombreArchivo);

			setToast({ tipo: "ok", mensaje: "Reporte generado correctamente" });
		} catch (err) {
			console.error("Error al generar el PDF del reporte:", err);
			setToast({ tipo: "error", mensaje: "No se pudo generar el reporte" });
		} finally {
			setGenerando(false);
			setTimeout(() => setToast(null), 3000);
		}
	};

	return (
		<div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
			<Sidebar activeItem="reportes" />

			<main className="flex-1 h-screen overflow-y-auto p-8">
				<div className="max-w-screen-2xl mx-auto">

					{/* Header */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
						<div>
							<h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">Reportes y Estadísticas</h2>
							<p className="text-sm text-[#3f484e] mt-1">Resumen del desempeño clínico y administrativo de Armonía Dental</p>
						</div>
						<button type="button" onClick={generarReporte} disabled={cargando || generando}
							className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
							<span className="material-symbols-outlined text-[18px]">description</span>
							{generando ? "Generando..." : "Generar reporte"}
						</button>
					</div>

					{/* Estado de carga / error */}
					{cargando && (
						<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm mb-6 text-sm text-[#3f484e]">
							Cargando datos del reporte...
						</div>
					)}

					{!cargando && errorCarga && (
						<div className="bg-white border border-[#ba1a1a]/30 rounded-xl p-5 shadow-sm mb-6 flex items-center justify-between gap-4">
							<p className="text-sm text-[#ba1a1a]">{errorCarga}</p>
							<button onClick={cargarDatos}
								className="px-4 py-2 bg-[#ba1a1a] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity shrink-0">
								Reintentar
							</button>
						</div>
					)}

					{!cargando && !errorCarga && (
						<>
							{/* KPIs */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
								<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
									<div className="flex items-center gap-3 mb-3">
										<div className="bg-[#7dd3fc20] p-2 rounded-lg">
											<span className="material-symbols-outlined text-[#006686] text-[20px]">groups</span>
										</div>
										<p className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">Pacientes registrados</p>
									</div>
									<p className="text-[32px] font-bold text-[#151c27]">{pacientes.length}</p>
									<p className="text-xs text-[#3f484e] mt-1">{pacientes.filter((p) => p.activo).length} activos</p>
								</div>

								<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
									<div className="flex items-center gap-3 mb-3">
										<div className="bg-[#7dd3fc20] p-2 rounded-lg">
											<span className="material-symbols-outlined text-[#006686] text-[20px]">calendar_today</span>
										</div>
										<p className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">Total de citas</p>
									</div>
									<p className="text-[32px] font-bold text-[#151c27]">{citas.length}</p>
									<p className="text-xs text-[#3f484e] mt-1">{citas.filter((c) => c.estado === "Cancelada").length} canceladas</p>
								</div>

								<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
									<div className="flex items-center gap-3 mb-3">
										<div className="bg-[#ffdad6]/40 p-2 rounded-lg">
											<span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">warning</span>
										</div>
										<p className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">Insumos críticos</p>
									</div>
									<p className="text-[32px] font-bold text-[#ba1a1a]">{insumosStockBajo.length}</p>
									<p className="text-xs text-[#3f484e] mt-1">Requieren reabastecimiento</p>
								</div>
							</div>

							<div className="grid lg:grid-cols-2 gap-6 mb-6">

								{/* Tratamientos más frecuentes */}
								<div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
									<h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2">
										<span className="material-symbols-outlined text-[#006686] text-[20px]">bar_chart</span>
										Tratamientos más frecuentes
									</h3>
									{tratamientosOrdenados.length === 0 ? (
										<p className="text-sm text-[#3f484e]">Aún no hay citas registradas.</p>
									) : (
										<div className="space-y-4">
											{tratamientosOrdenados.map(([tipo, cantidad]) => (
												<div key={tipo}>
													<div className="flex justify-between text-sm mb-1.5">
														<span className="text-[#151c27] font-medium">{tipo}</span>
														<span className="font-semibold text-[#006686]">{cantidad} citas</span>
													</div>
													<div className="w-full bg-[#f0f3ff] rounded-full h-2">
														<div className="bg-[#006686] rounded-full h-2 transition-all"
															style={{ width: `${(cantidad / maxTratamiento) * 100}%` }} />
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Estado de citas */}
								<div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
									<h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2">
										<span className="material-symbols-outlined text-[#006686] text-[20px]">event_available</span>
										Estado de Citas
									</h3>
									{citas.length === 0 ? (
										<p className="text-sm text-[#3f484e]">Aún no hay citas registradas.</p>
									) : (
										<>
											<div className="space-y-3 mb-5">
												{Object.entries(estadoCitas).map(([estado, cantidad]) => (
													<div key={estado} className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															<span className={`w-2.5 h-2.5 rounded-full ${COLORES_ESTADO[estado]?.dot || "bg-[#3f484e]"}`} />
															<span className="text-sm text-[#151c27]">{estado}</span>
														</div>
														<div className="flex items-center gap-2">
															<span className="font-semibold text-sm text-[#151c27]">{cantidad}</span>
															<span className="text-xs text-[#3f484e]">({Math.round((cantidad / citas.length) * 100)}%)</span>
														</div>
													</div>
												))}
											</div>
											{/* Barra stacked */}
											<div className="flex w-full h-3 rounded-full overflow-hidden">
												{Object.entries(estadoCitas).map(([estado, cantidad]) => (
													<div key={estado}
														className={`${COLORES_ESTADO[estado]?.bar || "bg-[#dce2f3]"} transition-all`}
														style={{ width: `${(cantidad / citas.length) * 100}%` }}
														title={`${estado}: ${cantidad}`} />
												))}
											</div>
										</>
									)}
								</div>
							</div>

							{/* Horas trabajadas (real, desde /v1/marcas/resumen) */}
							<div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm mb-6">
								<h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2">
									<span className="material-symbols-outlined text-[#006686] text-[20px]">schedule</span>
									Horas trabajadas por empleado
								</h3>
								{porEmpleado.length === 0 ? (
									<p className="text-sm text-[#3f484e]">
										No hay marcas registradas todavía, o tu sesión no tiene permiso para ver este resumen.
									</p>
								) : (
									<div className="space-y-4">
										{porEmpleado.map((e) => (
											<div key={e.usuario_id}>
												<div className="flex justify-between text-sm mb-1.5">
													<span className="text-[#151c27] font-medium truncate">
														{e.nombre}{e.rol ? ` · ${e.rol}` : ""}
													</span>
													<span className="font-semibold text-[#006686]">{(e.totalHoras ?? 0).toFixed(1)}h</span>
												</div>
												<div className="w-full bg-[#f0f3ff] rounded-full h-2">
													<div className="bg-[#7dd3fc] rounded-full h-2"
														style={{ width: `${Math.min(((e.totalHoras ?? 0) / maxHoras) * 100, 100)}%` }} />
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Insumos críticos */}
							{insumosStockBajo.length > 0 && (
								<div className="bg-white border border-[#ba1a1a]/20 rounded-xl p-6 shadow-sm">
									<h3 className="font-semibold text-[#ba1a1a] mb-5 flex items-center gap-2">
										<span className="material-symbols-outlined text-[20px]">warning</span>
										Insumos con stock crítico
									</h3>
									<div className="overflow-x-auto">
										<table className="w-full text-left border-collapse">
											<thead>
												<tr className="bg-[#ffdad6]/30 border-b border-[#ba1a1a]/10">
													{["Insumo", "Categoría", "Stock actual", "Stock mínimo", "Proveedor"].map((h) => (
														<th key={h} className="px-4 py-3 text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">{h}</th>
													))}
												</tr>
											</thead>
											<tbody className="divide-y divide-[#bec8ce]/40">
												{insumosStockBajo.map((ins) => (
													<tr key={ins._id} className="hover:bg-[#ffdad6]/10 transition-colors">
														<td className="px-4 py-3 text-sm font-semibold text-[#151c27]">{ins.nombre}</td>
														<td className="px-4 py-3">
															<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#bec8ce] text-[#3f484e] bg-[#dce2f3]">{ins.categoria}</span>
														</td>
														<td className="px-4 py-3">
															<span className="font-bold text-[#ba1a1a] text-sm">{ins.stock_actual} {ins.unidad}</span>
														</td>
														<td className="px-4 py-3 text-sm text-[#3f484e]">{ins.stock_minimo}</td>
														<td className="px-4 py-3 text-sm text-[#3f484e]">{ins.proveedor}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</main>

			{/* Toast */}
			{toast && (
				<div className="fixed bottom-6 right-6 z-50">
					<div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
						<div className={`${toast.tipo === "ok" ? "bg-[#6df5e120]" : "bg-[#ffdad6]/40"} p-3 rounded-xl`}>
							<span
								className={`material-symbols-outlined ${toast.tipo === "ok" ? "text-[#006b5f]" : "text-[#ba1a1a]"}`}
								style={{ fontVariationSettings: "'FILL' 1" }}
							>
								{toast.tipo === "ok" ? "description" : "error"}
							</span>
						</div>
						<div className="flex-1">
							<p className="text-sm font-semibold text-[#151c27]">{toast.mensaje}</p>
						</div>
						<button onClick={() => setToast(null)} className="text-[#bec8ce] hover:text-[#3f484e] transition-colors">
							<span className="material-symbols-outlined text-[18px]">close</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Reportes;
