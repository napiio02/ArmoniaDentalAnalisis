import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { CITAS, PACIENTES, MARCAS } from "../data/mockData";

const COLORES_ESTADO = {
	"Programada":  { bar: "bg-[#ffddb8]",  dot: "bg-[#855300]" },
	"Confirmada":  { bar: "bg-[#7dd3fc]",  dot: "bg-[#006686]" },
	"Atendida":    { bar: "bg-[#6df5e1]",  dot: "bg-[#006b5f]" },
	"Cancelada":   { bar: "bg-[#ffdad6]",  dot: "bg-[#ba1a1a]" },
	"No asistió":  { bar: "bg-[#dce2f3]",  dot: "bg-[#3f484e]" },
	"En atención": { bar: "bg-[#bfc8ce]",  dot: "bg-[#3f484e]" },
};

const Reportes = () => {
	const [toast, setToast] = useState(false);

	const frecuenciaTratamiento = CITAS.reduce((acc, c) => {
		acc[c.tipo] = (acc[c.tipo] || 0) + 1;
		return acc;
	}, {});
	const tratamientosOrdenados = Object.entries(frecuenciaTratamiento).sort((a, b) => b[1] - a[1]);
	const maxTratamiento = tratamientosOrdenados.length > 0 ? Math.max(...tratamientosOrdenados.map((t) => t[1])) : 1;

	const estadoCitas = CITAS.reduce((acc, c) => { acc[c.estado] = (acc[c.estado] || 0) + 1; return acc; }, {});

	const horasPorEmpleado = MARCAS.reduce((acc, m) => {
		const n = m.usuario_id.nombre;
		acc[n] = (acc[n] || 0) + m.horas_trabajadas;
		return acc;
	}, {});

	const [insumosStockBajo, setInsumosStockBajo] = useState([]);

useEffect(() => {
  fetch("http://localhost:3000/v1/insumos")
	.then((res) => res.json())
	.then((data) => {
	  const lista = Array.isArray(data) ? data : data.data ?? [];
	  setInsumosStockBajo(lista.filter((i) => i.activo && i.stock_actual <= i.stock_minimo));
	})
	.catch(() => {});
}, []);

	const generarReporte = () => {
		setToast(true);
		setTimeout(() => setToast(false), 3000);
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
						<button type="button" onClick={generarReporte}
							className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
							<span className="material-symbols-outlined text-[18px]">description</span>
							Generar reporte
						</button>
					</div>

					{/* KPIs */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
						<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
							<div className="flex items-center gap-3 mb-3">
								<div className="bg-[#7dd3fc20] p-2 rounded-lg">
									<span className="material-symbols-outlined text-[#006686] text-[20px]">groups</span>
								</div>
								<p className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">Pacientes registrados</p>
							</div>
							<p className="text-[32px] font-bold text-[#151c27]">{PACIENTES.length}</p>
							<p className="text-xs text-[#3f484e] mt-1">{PACIENTES.filter((p) => p.activo).length} activos</p>
						</div>

						<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
							<div className="flex items-center gap-3 mb-3">
								<div className="bg-[#7dd3fc20] p-2 rounded-lg">
									<span className="material-symbols-outlined text-[#006686] text-[20px]">calendar_today</span>
								</div>
								<p className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">Total de citas</p>
							</div>
							<p className="text-[32px] font-bold text-[#151c27]">{CITAS.length}</p>
							<p className="text-xs text-[#3f484e] mt-1">{CITAS.filter((c) => c.estado === "Cancelada").length} canceladas</p>
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
						</div>

						{/* Estado de citas */}
						<div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
							<h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2">
								<span className="material-symbols-outlined text-[#006686] text-[20px]">event_available</span>
								Estado de Citas
							</h3>
							<div className="space-y-3 mb-5">
								{Object.entries(estadoCitas).map(([estado, cantidad]) => (
									<div key={estado} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className={`w-2.5 h-2.5 rounded-full ${COLORES_ESTADO[estado]?.dot || "bg-[#3f484e]"}`} />
											<span className="text-sm text-[#151c27]">{estado}</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="font-semibold text-sm text-[#151c27]">{cantidad}</span>
											<span className="text-xs text-[#3f484e]">({Math.round((cantidad / CITAS.length) * 100)}%)</span>
										</div>
									</div>
								))}
							</div>
							{/* Barra stacked */}
							<div className="flex w-full h-3 rounded-full overflow-hidden">
								{Object.entries(estadoCitas).map(([estado, cantidad]) => (
									<div key={estado}
										className={`${COLORES_ESTADO[estado]?.bar || "bg-[#dce2f3]"} transition-all`}
										style={{ width: `${(cantidad / CITAS.length) * 100}%` }}
										title={`${estado}: ${cantidad}`} />
								))}
							</div>
						</div>
					</div>

					{/* Horas trabajadas */}
					<div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm mb-6">
						<h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2">
							<span className="material-symbols-outlined text-[#006686] text-[20px]">schedule</span>
							Horas trabajadas por empleado (semana)
						</h3>
						<div className="space-y-4">
							{Object.entries(horasPorEmpleado).map(([nombre, horas]) => (
								<div key={nombre}>
									<div className="flex justify-between text-sm mb-1.5">
										<span className="text-[#151c27] font-medium truncate">{nombre}</span>
										<span className="font-semibold text-[#006686]">{horas.toFixed(1)}h</span>
									</div>
									<div className="w-full bg-[#f0f3ff] rounded-full h-2">
										<div className="bg-[#7dd3fc] rounded-full h-2"
											style={{ width: `${Math.min((horas / 45) * 100, 100)}%` }} />
									</div>
								</div>
							))}
						</div>
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
				</div>
			</main>

			{/* Toast */}
			{toast && (
				<div className="fixed bottom-6 right-6 z-50">
					<div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
						<div className="bg-[#6df5e120] p-3 rounded-xl">
							<span className="material-symbols-outlined text-[#006b5f]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
						</div>
						<div className="flex-1">
							<p className="text-sm font-semibold text-[#151c27]">Reporte generado correctamente</p>
						</div>
						<button onClick={() => setToast(false)} className="text-[#bec8ce] hover:text-[#3f484e] transition-colors">
							<span className="material-symbols-outlined text-[18px]">close</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Reportes;
