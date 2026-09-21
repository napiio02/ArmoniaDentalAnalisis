import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from "../components/Sidebar";
import { obtenerDatosReporte } from "../services/reporteService";

const ZONA_HORARIA = "America/Costa_Rica";

const COLORES_ESTADO = {
	Programada: { bar: "bg-[#ffddb8]", dot: "bg-[#855300]" },
	Confirmada: { bar: "bg-[#7dd3fc]", dot: "bg-[#006686]" },
	Atendida: { bar: "bg-[#6df5e1]", dot: "bg-[#006b5f]" },
	Cancelada: { bar: "bg-[#ffdad6]", dot: "bg-[#ba1a1a]" },
	"No asistió": { bar: "bg-[#dce2f3]", dot: "bg-[#3f484e]" },
	"En atención": { bar: "bg-[#bfc8ce]", dot: "bg-[#3f484e]" },
};

const fechaISO = (anio, mes, dia) =>
	`${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

const partesFechaCostaRica = () => {
	const partes = new Intl.DateTimeFormat("en-US", {
		timeZone: ZONA_HORARIA,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());
	const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
	return { anio: Number(valores.year), mes: Number(valores.month), dia: Number(valores.day) };
};

const sumarDias = (valor, cantidad) => {
	const [anio, mes, dia] = valor.split("-").map(Number);
	const fecha = new Date(Date.UTC(anio, mes - 1, dia));
	fecha.setUTCDate(fecha.getUTCDate() + cantidad);
	return fecha.toISOString().slice(0, 10);
};

const periodoPredefinido = (tipo) => {
	const { anio, mes } = partesFechaCostaRica();

	if (tipo === "anio") {
		return {
			desde: fechaISO(anio, 1, 1),
			hasta: fechaISO(anio + 1, 1, 1),
			fechaFinalInclusiva: fechaISO(anio, 12, 31),
		};
	}

	const siguienteAnio = mes === 12 ? anio + 1 : anio;
	const siguienteMes = mes === 12 ? 1 : mes + 1;
	const hasta = fechaISO(siguienteAnio, siguienteMes, 1);

	return {
		desde: fechaISO(anio, mes, 1),
		hasta,
		fechaFinalInclusiva: sumarDias(hasta, -1),
	};
};

const formatearFechaISO = (valor) => {
	if (!valor) return "—";
	return new Intl.DateTimeFormat("es-CR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${valor}T12:00:00Z`));
};

const formatearFechaHora = (valor) =>
	new Intl.DateTimeFormat("es-CR", {
		dateStyle: "long",
		timeStyle: "short",
		timeZone: ZONA_HORARIA,
	}).format(new Date(valor));

const ErrorSeccion = ({ mensaje }) => (
	<div className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/20 px-4 py-3 text-sm text-[#ba1a1a]">
		{mensaje}
	</div>
);

const Reportes = () => {
	const periodoInicial = periodoPredefinido("mes");
	const [tipoPeriodo, setTipoPeriodo] = useState("mes");
	const [desdePersonalizado, setDesdePersonalizado] = useState(periodoInicial.desde);
	const [hastaPersonalizado, setHastaPersonalizado] = useState(periodoInicial.fechaFinalInclusiva);
	const [periodoAplicado, setPeriodoAplicado] = useState(periodoInicial);
	const [errorFiltro, setErrorFiltro] = useState("");
	const [reintento, setReintento] = useState(0);
	const [reporte, setReporte] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [errorCarga, setErrorCarga] = useState("");
	const [toast, setToast] = useState(null);
	const [generando, setGenerando] = useState(false);

	useEffect(() => {
		const controller = new AbortController();
		setCargando(true);
		setErrorCarga("");
		setReporte(null);

		obtenerDatosReporte({
			desde: periodoAplicado.desde,
			hasta: periodoAplicado.hasta,
			signal: controller.signal,
		})
			.then(setReporte)
			.catch((error) => {
				if (error.name !== "AbortError") {
					setErrorCarga(error.message || "No se pudieron cargar los datos del reporte.");
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setCargando(false);
			});

		return () => controller.abort();
	}, [periodoAplicado.desde, periodoAplicado.hasta, reintento]);

	const cambiarPeriodo = (event) => {
		const tipo = event.target.value;
		setTipoPeriodo(tipo);
		setErrorFiltro("");

		if (tipo !== "personalizado") {
			setPeriodoAplicado(periodoPredefinido(tipo));
		}
	};

	const aplicarRangoPersonalizado = () => {
		if (!desdePersonalizado || !hastaPersonalizado) {
			setErrorFiltro("Debes indicar la fecha inicial y la fecha final.");
			return;
		}

		if (desdePersonalizado > hastaPersonalizado) {
			setErrorFiltro("La fecha final no puede ser anterior a la fecha inicial.");
			return;
		}

		setErrorFiltro("");
		setPeriodoAplicado({
			desde: desdePersonalizado,
			hasta: sumarDias(hastaPersonalizado, 1),
			fechaFinalInclusiva: hastaPersonalizado,
		});
	};

	const periodoMostrado = reporte?.periodo ?? periodoAplicado;
	const tratamientos = reporte?.citas?.tratamientos ?? [];
	const estados = reporte?.citas?.estados ?? [];
	const porEmpleado = reporte?.horas?.porEmpleado ?? [];
	const insumosCriticos = reporte?.stockCritico?.insumos ?? [];
	const maxTratamiento = Math.max(...tratamientos.map((item) => item.cantidad), 1);
	const maxHoras = Math.max(...porEmpleado.map((item) => item.totalHoras), 1);

	const generarReporte = () => {
		if (!reporte || cargando || generando) return;
		setGenerando(true);

		try {
			const doc = new jsPDF();
			const margenX = 14;
			let cursorY = 18;
			const periodoTexto = `Período: ${formatearFechaISO(reporte.periodo.desde)} al ${formatearFechaISO(reporte.periodo.fechaFinalInclusiva)}`;

			const agregarTabla = (titulo, encabezado, filas, color = [0, 102, 134]) => {
				if (cursorY > 260) {
					doc.addPage();
					cursorY = 18;
				}

				doc.setFont("helvetica", "bold");
				doc.setFontSize(11);
				doc.setTextColor(...color);
				doc.text(titulo, margenX, cursorY);

				autoTable(doc, {
					startY: cursorY + 3,
					margin: { left: margenX, right: margenX },
					head: [encabezado],
					body: filas,
					theme: "striped",
					headStyles: { fillColor: color },
					styles: { fontSize: 9 },
				});
				cursorY = doc.lastAutoTable.finalY + 10;
			};

			doc.setFont("helvetica", "bold");
			doc.setFontSize(16);
			doc.setTextColor(21, 28, 39);
			doc.text("Reportes y Estadísticas - Armonía Dental", margenX, cursorY);

			cursorY += 7;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.setTextColor(63, 72, 78);
			doc.text(periodoTexto, margenX, cursorY);
			cursorY += 5;
			doc.text(`Reporte generado el ${formatearFechaHora(reporte.generadoEn)}`, margenX, cursorY);
			cursorY += 10;

			autoTable(doc, {
				startY: cursorY,
				margin: { left: margenX, right: margenX },
				head: [["Indicador", "Valor"]],
				body: [
					["Pacientes nuevos", reporte.pacientes ? String(reporte.pacientes.nuevos) : "Datos no disponibles"],
					["Total de citas", reporte.citas ? String(reporte.citas.total) : "Datos no disponibles"],
					["Citas canceladas", reporte.citas ? String(reporte.citas.canceladas) : "Datos no disponibles"],
					["Stock crítico al generar el reporte", reporte.stockCritico ? String(reporte.stockCritico.total) : "Datos no disponibles"],
				],
				theme: "striped",
				headStyles: { fillColor: [0, 102, 134] },
				styles: { fontSize: 9 },
			});
			cursorY = doc.lastAutoTable.finalY + 10;

			agregarTabla(
				"Tratamientos más frecuentes",
				["Tratamiento", "Cantidad de citas"],
				reporte.citas
					? (tratamientos.length ? tratamientos.map((item) => [item.tipo, String(item.cantidad)]) : [["Sin citas en el período", "0"]])
					: [[reporte.errores.citas, "Datos no disponibles"]],
			);

			agregarTabla(
				"Estado de citas",
				["Estado", "Cantidad", "Porcentaje"],
				reporte.citas
					? (estados.length ? estados.map((item) => [
						item.estado,
						String(item.cantidad),
						`${Math.round((item.cantidad / reporte.citas.total) * 100)}%`,
					]) : [["Sin citas en el período", "0", "0%"]])
					: [[reporte.errores.citas, "Datos no disponibles", "—"]],
			);

			agregarTabla(
				"Horas trabajadas por empleado",
				["Empleado", "Rol", "Días únicos", "Total de horas"],
				reporte.horas
					? (porEmpleado.length ? porEmpleado.map((item) => [
						item.nombre,
						item.rol ?? "—",
						String(item.diasTrabajados),
						`${Number(item.totalHoras).toFixed(1)}h`,
					]) : [["Sin marcas en el período", "—", "0", "0h"]])
					: [[reporte.errores.horas, "—", "—", "Datos no disponibles"]],
			);

			agregarTabla(
				"Stock crítico al momento de generar el reporte",
				["Insumo", "Categoría", "Stock actual", "Stock mínimo", "Proveedor"],
				reporte.stockCritico
					? (insumosCriticos.length ? insumosCriticos.map((item) => [
						item.nombre,
						item.categoria,
						`${item.stock_actual} ${item.unidad ?? ""}`.trim(),
						String(item.stock_minimo),
						item.proveedor ?? "—",
					]) : [["No hay insumos con stock crítico", "—", "—", "—", "—"]])
					: [[reporte.errores.stockCritico, "—", "—", "—", "Datos no disponibles"]],
				[186, 26, 26],
			);

			const fechaArchivo = new Intl.DateTimeFormat("en-CA", {
				timeZone: ZONA_HORARIA,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(new Date(reporte.generadoEn));
			doc.save(`ArmoniaDental_Reporte_${fechaArchivo}.pdf`);
			setToast({ tipo: "ok", mensaje: "Reporte generado correctamente" });
		} catch (error) {
			console.error("Error al generar el PDF del reporte:", error);
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
					<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
						<div>
							<h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">Reportes y Estadísticas</h2>
							<p className="text-sm text-[#3f484e] mt-1">Resumen del desempeño clínico y administrativo de Armonía Dental</p>
						</div>
						<button type="button" onClick={generarReporte} disabled={!reporte || cargando || generando}
							className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
							<span className="material-symbols-outlined text-[18px]">description</span>
							{generando ? "Generando..." : "Generar reporte"}
						</button>
					</div>

					<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm mb-6">
						<div className="flex flex-col xl:flex-row xl:items-end gap-4">
							<div className="min-w-[210px]">
								<label htmlFor="periodo-reporte" className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-2">Período del reporte</label>
								<select id="periodo-reporte" value={tipoPeriodo} onChange={cambiarPeriodo}
									className="w-full rounded-lg border border-[#bec8ce] bg-white px-3 py-2.5 text-sm text-[#151c27] focus:outline-none focus:ring-2 focus:ring-[#006686]/30">
									<option value="mes">Este mes</option>
									<option value="anio">Este año</option>
									<option value="personalizado">Rango personalizado</option>
								</select>
							</div>

							{tipoPeriodo === "personalizado" && (
								<>
									<div>
										<label htmlFor="reporte-desde" className="block text-xs font-semibold text-[#3f484e] mb-2">Fecha inicial</label>
										<input id="reporte-desde" type="date" value={desdePersonalizado} max={hastaPersonalizado}
											onChange={(event) => setDesdePersonalizado(event.target.value)}
											className="rounded-lg border border-[#bec8ce] bg-white px-3 py-2 text-sm text-[#151c27] focus:outline-none focus:ring-2 focus:ring-[#006686]/30" />
									</div>
									<div>
										<label htmlFor="reporte-hasta" className="block text-xs font-semibold text-[#3f484e] mb-2">Fecha final</label>
										<input id="reporte-hasta" type="date" value={hastaPersonalizado} min={desdePersonalizado}
											onChange={(event) => setHastaPersonalizado(event.target.value)}
											className="rounded-lg border border-[#bec8ce] bg-white px-3 py-2 text-sm text-[#151c27] focus:outline-none focus:ring-2 focus:ring-[#006686]/30" />
									</div>
									<button type="button" onClick={aplicarRangoPersonalizado}
										className="px-5 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity">
										Aplicar rango
									</button>
								</>
							)}

							<div className="xl:ml-auto text-sm text-[#3f484e]">
								<p className="font-semibold text-[#151c27]">Del {formatearFechaISO(periodoMostrado.desde)} al {formatearFechaISO(periodoMostrado.fechaFinalInclusiva)}</p>
							</div>
						</div>
						{errorFiltro && <p className="text-xs text-[#ba1a1a] mt-3">{errorFiltro}</p>}
					</div>

					{cargando && (
						<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm mb-6 text-sm text-[#3f484e]">Cargando datos del reporte...</div>
					)}

					{!cargando && errorCarga && (
						<div className="bg-white border border-[#ba1a1a]/30 rounded-xl p-5 shadow-sm mb-6 flex items-center justify-between gap-4">
							<p className="text-sm text-[#ba1a1a]">{errorCarga}</p>
							<button type="button" onClick={() => setReintento((valor) => valor + 1)}
								className="px-4 py-2 bg-[#ba1a1a] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity shrink-0">Reintentar</button>
						</div>
					)}

					{!cargando && reporte && (
						<>
							{Object.keys(reporte.errores).length > 0 && (
								<div className="bg-[#ffdad6]/20 border border-[#ba1a1a]/30 rounded-xl p-4 mb-6 text-sm text-[#ba1a1a]">
									El reporte se cargó parcialmente. Las secciones afectadas se identifican a continuación.
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
								<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
									<div className="flex items-center gap-3 mb-3">
										<div className="bg-[#7dd3fc20] p-2 rounded-lg"><span className="material-symbols-outlined text-[#006686] text-[20px]">groups</span></div>
										<p className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">Pacientes nuevos</p>
									</div>
									{reporte.pacientes ? <><p className="text-[32px] font-bold text-[#151c27]">{reporte.pacientes.nuevos}</p><p className="text-xs text-[#3f484e] mt-1">Registrados en el período</p></> : <ErrorSeccion mensaje={reporte.errores.pacientes} />}
								</div>

								<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
									<div className="flex items-center gap-3 mb-3">
										<div className="bg-[#7dd3fc20] p-2 rounded-lg"><span className="material-symbols-outlined text-[#006686] text-[20px]">calendar_today</span></div>
										<p className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">Total de citas</p>
									</div>
									{reporte.citas ? <><p className="text-[32px] font-bold text-[#151c27]">{reporte.citas.total}</p><p className="text-xs text-[#3f484e] mt-1">{reporte.citas.canceladas} canceladas en el período</p></> : <ErrorSeccion mensaje={reporte.errores.citas} />}
								</div>

								<div className="bg-white border border-[#bec8ce] rounded-xl p-5 shadow-sm">
									<div className="flex items-center gap-3 mb-3">
										<div className="bg-[#ffdad6]/40 p-2 rounded-lg"><span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">warning</span></div>
										<p className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">Stock crítico actual</p>
									</div>
									{reporte.stockCritico ? <><p className="text-[32px] font-bold text-[#ba1a1a]">{reporte.stockCritico.total}</p><p className="text-xs text-[#3f484e] mt-1">Al momento de generar el reporte</p></> : <ErrorSeccion mensaje={reporte.errores.stockCritico} />}
								</div>
							</div>

							<div className="grid lg:grid-cols-2 gap-6 mb-6">
								<div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
									<h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-[#006686] text-[20px]">bar_chart</span>Tratamientos más frecuentes</h3>
									{!reporte.citas ? <ErrorSeccion mensaje={reporte.errores.citas} /> : tratamientos.length === 0 ? (
										<p className="text-sm text-[#3f484e]">No hay citas registradas en el período.</p>
									) : (
										<div className="space-y-4">{tratamientos.map((item) => (
											<div key={item.tipo}>
												<div className="flex justify-between text-sm mb-1.5"><span className="text-[#151c27] font-medium">{item.tipo}</span><span className="font-semibold text-[#006686]">{item.cantidad} citas</span></div>
												<div className="w-full bg-[#f0f3ff] rounded-full h-2"><div className="bg-[#006686] rounded-full h-2 transition-all" style={{ width: `${(item.cantidad / maxTratamiento) * 100}%` }} /></div>
											</div>
										))}</div>
									)}
								</div>

								<div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm">
									<h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-[#006686] text-[20px]">event_available</span>Estado de Citas</h3>
									{!reporte.citas ? <ErrorSeccion mensaje={reporte.errores.citas} /> : estados.length === 0 ? (
										<p className="text-sm text-[#3f484e]">No hay citas registradas en el período.</p>
									) : (
										<><div className="space-y-3 mb-5">{estados.map((item) => (
											<div key={item.estado} className="flex items-center justify-between">
												<div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${COLORES_ESTADO[item.estado]?.dot || "bg-[#3f484e]"}`} /><span className="text-sm text-[#151c27]">{item.estado}</span></div>
												<div className="flex items-center gap-2"><span className="font-semibold text-sm text-[#151c27]">{item.cantidad}</span><span className="text-xs text-[#3f484e]">({Math.round((item.cantidad / reporte.citas.total) * 100)}%)</span></div>
											</div>
										))}</div>
										<div className="flex w-full h-3 rounded-full overflow-hidden">{estados.map((item) => <div key={item.estado} className={`${COLORES_ESTADO[item.estado]?.bar || "bg-[#dce2f3]"} transition-all`} style={{ width: `${(item.cantidad / reporte.citas.total) * 100}%` }} title={`${item.estado}: ${item.cantidad}`} />)}</div></>
									)}
								</div>
							</div>

							<div className="bg-white border border-[#bec8ce] rounded-xl p-6 shadow-sm mb-6">
								<h3 className="font-semibold text-[#151c27] mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-[#006686] text-[20px]">schedule</span>Horas trabajadas por empleado</h3>
								{!reporte.horas ? <ErrorSeccion mensaje={reporte.errores.horas} /> : porEmpleado.length === 0 ? (
									<p className="text-sm text-[#3f484e]">No hay marcas registradas en el período.</p>
								) : (
									<div className="space-y-4">{porEmpleado.map((item) => (
										<div key={item.usuario_id}>
											<div className="flex justify-between text-sm mb-1.5"><span className="text-[#151c27] font-medium truncate">{item.nombre}{item.rol ? ` · ${item.rol}` : ""} · {item.diasTrabajados} días</span><span className="font-semibold text-[#006686]">{Number(item.totalHoras).toFixed(1)}h</span></div>
											<div className="w-full bg-[#f0f3ff] rounded-full h-2"><div className="bg-[#7dd3fc] rounded-full h-2" style={{ width: `${Math.min((item.totalHoras / maxHoras) * 100, 100)}%` }} /></div>
										</div>
									))}</div>
								)}
							</div>

							<div className="bg-white border border-[#ba1a1a]/20 rounded-xl p-6 shadow-sm">
								<h3 className="font-semibold text-[#ba1a1a] mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">warning</span>Stock crítico al momento de generar el reporte</h3>
								<p className="text-xs text-[#3f484e] mb-5">Estado del inventario al {formatearFechaHora(reporte.generadoEn)}.</p>
								{!reporte.stockCritico ? <ErrorSeccion mensaje={reporte.errores.stockCritico} /> : insumosCriticos.length === 0 ? (
									<p className="text-sm text-[#3f484e]">No hay insumos activos con stock crítico.</p>
								) : (
									<div className="overflow-x-auto"><table className="w-full text-left border-collapse">
										<thead><tr className="bg-[#ffdad6]/30 border-b border-[#ba1a1a]/10">{["Insumo", "Categoría", "Stock actual", "Stock mínimo", "Proveedor"].map((titulo) => <th key={titulo} className="px-4 py-3 text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider">{titulo}</th>)}</tr></thead>
										<tbody className="divide-y divide-[#bec8ce]/40">{insumosCriticos.map((item) => (
											<tr key={item._id} className="hover:bg-[#ffdad6]/10 transition-colors"><td className="px-4 py-3 text-sm font-semibold text-[#151c27]">{item.nombre}</td><td className="px-4 py-3"><span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#bec8ce] text-[#3f484e] bg-[#dce2f3]">{item.categoria}</span></td><td className="px-4 py-3 font-bold text-[#ba1a1a] text-sm">{item.stock_actual} {item.unidad}</td><td className="px-4 py-3 text-sm text-[#3f484e]">{item.stock_minimo}</td><td className="px-4 py-3 text-sm text-[#3f484e]">{item.proveedor || "—"}</td></tr>
										))}</tbody>
									</table></div>
								)}
							</div>
						</>
					)}
				</div>
			</main>

			{toast && (
				<div className="fixed bottom-6 right-6 z-50"><div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
					<div className={`${toast.tipo === "ok" ? "bg-[#6df5e120]" : "bg-[#ffdad6]/40"} p-3 rounded-xl`}><span className={`material-symbols-outlined ${toast.tipo === "ok" ? "text-[#006b5f]" : "text-[#ba1a1a]"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{toast.tipo === "ok" ? "description" : "error"}</span></div>
					<p className="text-sm font-semibold text-[#151c27] flex-1">{toast.mensaje}</p>
					<button type="button" onClick={() => setToast(null)} className="text-[#bec8ce] hover:text-[#3f484e] transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>
				</div></div>
			)}
		</div>
	);
};

export default Reportes;
