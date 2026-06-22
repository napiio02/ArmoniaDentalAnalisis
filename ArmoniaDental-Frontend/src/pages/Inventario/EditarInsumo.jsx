import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { insumoService } from "../../services/insumoService";

const CATEGORIAS = [
	"Protección", "Anestesia", "Materiales restaurativos",
	"Cirugía", "Instrumental", "Prevención", "Ortodoncia", "Diagnóstico",
];

const Label = ({ children, optional }) => (
	<div className="flex justify-between mb-1.5">
		<label className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">{children}</label>
		{optional && <span className="text-xs text-[#bec8ce]">Opcional</span>}
	</div>
);

const inputCls = (error) =>
	`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none bg-white text-[#151c27] transition-colors ${
		error ? "border-[#ba1a1a] focus:border-[#ba1a1a]" : "border-[#bec8ce] focus:border-[#006686]"
	}`;

const formatFechaInput = (fecha) => {
	if (!fecha) return "";
	return new Date(fecha).toISOString().split("T")[0];
};

const formatFechaMovimiento = (fecha) => {
	return new Date(fecha).toLocaleDateString("es-CR", {
		day: "numeric", month: "short", year: "numeric",
	});
};

// ── Config visual por tipo de movimiento ──
const MOVIMIENTO_CONFIG = {
	entrada: {
		icono: "arrow_downward",
		signo: "+",
		iconoBg: "bg-[#6df5e120]",
		iconoColor: "text-[#006b5f]",
		textoColor: "text-[#006b5f]",
		etiqueta: "Entrada",
	},
	salida: {
		icono: "arrow_upward",
		signo: "-",
		iconoBg: "bg-[#ffdad6]/60",
		iconoColor: "text-[#ba1a1a]",
		textoColor: "text-[#ba1a1a]",
		etiqueta: "Salida",
	},
	ajuste: {
		icono: "tune",
		signo: "±",
		iconoBg: "bg-[#dce2f3]",
		iconoColor: "text-[#3f484e]",
		textoColor: "text-[#3f484e]",
		etiqueta: "Ajuste",
	},
};

const EditarInsumo = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [insumoOriginal, setInsumoOriginal] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [error, setError] = useState(null);
	const [errores, setErrores] = useState({});
	const [exito, setExito] = useState(false);

	const [movimientos, setMovimientos] = useState([]);
	const [cargandoMovimientos, setCargandoMovimientos] = useState(true);

	const [formData, setFormData] = useState({
		nombre: "", categoria: "", stock_minimo: "",
		unidad: "", proveedor: "", fecha_vencimiento: "",
	});

	useEffect(() => {
		const fetchInsumo = async () => {
			try {
				const { data } = await insumoService.getById(id);
				setInsumoOriginal(data);
				setFormData({
					nombre: data.nombre || "",
					categoria: data.categoria || "",
					stock_minimo: data.stock_minimo ?? "",
					unidad: data.unidad || "",
					proveedor: data.proveedor || "",
					fecha_vencimiento: formatFechaInput(data.fecha_vencimiento),
				});
			} catch {
				setError("No se encontró el insumo.");
			} finally {
				setCargando(false);
			}
		};
		fetchInsumo();
	}, [id]);

	useEffect(() => {
		const fetchMovimientos = async () => {
			try {
				const { data } = await insumoService.getMovimientos(id);
				setMovimientos(data);
			} catch {
				setMovimientos([]);
			} finally {
				setCargandoMovimientos(false);
			}
		};
		fetchMovimientos();
	}, [id]);

	const onChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
		if (errores[e.target.name])
			setErrores((prev) => ({ ...prev, [e.target.name]: undefined }));
	};

	const validar = () => {
		const e = {};
		if (!formData.nombre.trim())      e.nombre        = "El nombre es obligatorio";
		if (!formData.categoria)          e.categoria     = "La categoría es obligatoria";
		if (formData.stock_minimo === "") e.stock_minimo  = "El stock mínimo es obligatorio";
		if (!formData.unidad.trim())      e.unidad        = "La unidad es obligatoria";
		if (!formData.proveedor.trim())   e.proveedor     = "El proveedor es obligatorio";
		setErrores(e);
		return Object.keys(e).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validar()) return;
		setGuardando(true);
		setError(null);
		try {
			await insumoService.update(id, {
				...formData,
				stock_minimo: Number(formData.stock_minimo),
				fecha_vencimiento: formData.fecha_vencimiento || null,
			});
			setExito(true);
			setTimeout(() => navigate("/inventario"), 1200);
		} catch {
			setError("Error al guardar los cambios. Intentá de nuevo.");
			setGuardando(false);
		}
	};

	// ── Cargando ──
	if (cargando) return (
		<div className="min-h-screen bg-[#f9f9ff] flex flex-col">
			<header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
				<span className="text-2xl">ꨄ︎</span>
				<span className="font-bold text-[#151c27]">Armonía Dental</span>
			</header>
			<div className="flex-1 flex items-center justify-center">
				<span className="loading loading-spinner loading-lg text-[#006686]" />
			</div>
		</div>
	);

	// ── Error / no encontrado ──
	if (error && !insumoOriginal) return (
		<div className="min-h-screen bg-[#f9f9ff] flex flex-col">
			<header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
				<span className="text-2xl">ꨄ︎</span>
				<span className="font-bold text-[#151c27]">Armonía Dental</span>
			</header>
			<div className="flex-1 flex flex-col items-center justify-center gap-4">
				<div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-6 py-4 flex items-center gap-3 text-sm text-[#ba1a1a]">
					<span className="material-symbols-outlined">error</span>
					{error}
				</div>
				<button onClick={() => navigate("/inventario")}
					className="flex items-center gap-2 text-sm font-semibold text-[#006686] hover:underline">
					<span className="material-symbols-outlined text-[18px]">arrow_back</span>
					Volver al inventario
				</button>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif] flex flex-col">

			{/* Header */}
			<header className="bg-white border-b border-[#bec8ce] px-8 py-4 flex items-center gap-3">
				<Link to="/inventario"
					className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors text-[#3f484e]">
					<span className="material-symbols-outlined text-[20px]">arrow_back</span>
				</Link>
				<div className="w-px h-5 bg-[#bec8ce]" />
				<span className="text-2xl">ꨄ︎</span>
				<span className="font-bold text-[#151c27]">Armonía Dental</span>
				<span className="text-[#bec8ce] mx-1">/</span>
				<Link to="/inventario" className="text-sm text-[#3f484e] hover:text-[#006686] transition-colors">Inventario</Link>
				<span className="text-[#bec8ce] mx-1">/</span>
				<span className="text-sm font-semibold text-[#006686]">Editar Insumo</span>
			</header>

			{/* Contenido */}
			<div className="flex-1 flex items-start justify-center px-6 py-10">
				<div className="w-full max-w-2xl">

					<div className="mb-8">
						<h2 className="text-[28px] font-bold text-[#151c27]">Editar Insumo</h2>
						<p className="text-sm text-[#3f484e] mt-1">Modifique la información general del insumo</p>
					</div>

					{error && (
						<div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl px-5 py-3 flex items-center gap-3 mb-5 text-sm text-[#ba1a1a]">
							<span className="material-symbols-outlined text-[18px]">error</span>
							{error}
						</div>
					)}

					<div className="bg-white border border-[#bec8ce] rounded-2xl p-8 shadow-sm">

						{/* Código solo lectura */}
						<div className="bg-[#f0f3ff] rounded-xl p-4 mb-6 flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686]">
								<span className="material-symbols-outlined text-[20px]">inventory_2</span>
							</div>
							<div>
								<p className="font-semibold text-[#151c27] text-sm">{insumoOriginal.codigo}</p>
								<p className="text-xs text-[#3f484e]">
									Stock actual: {insumoOriginal.stock_actual} {insumoOriginal.unidad}
									<span className="mx-1">·</span>
									Se actualiza desde "Registrar entrada/salida"
								</p>
							</div>
						</div>

						<form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

								{/* Nombre */}
								<div className="md:col-span-2">
									<Label>Nombre del insumo *</Label>
									<input type="text" name="nombre" placeholder="Ej: Guantes de nitrilo"
										value={formData.nombre} onChange={onChange}
										className={inputCls(errores.nombre)} />
									{errores.nombre && <p className="text-xs text-[#ba1a1a] mt-1">{errores.nombre}</p>}
								</div>

								{/* Categoría */}
								<div>
									<Label>Categoría *</Label>
									<select name="categoria" value={formData.categoria} onChange={onChange}
										className={inputCls(errores.categoria)}>
										<option value="">Seleccionar categoría</option>
										{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
									</select>
									{errores.categoria && <p className="text-xs text-[#ba1a1a] mt-1">{errores.categoria}</p>}
								</div>

								{/* Unidad */}
								<div>
									<Label>Unidad *</Label>
									<input type="text" name="unidad" placeholder="Ej: Cajas, Unidades, Rollos"
										value={formData.unidad} onChange={onChange}
										className={inputCls(errores.unidad)} />
									{errores.unidad && <p className="text-xs text-[#ba1a1a] mt-1">{errores.unidad}</p>}
								</div>

								{/* Stock mínimo */}
								<div>
									<Label>Stock mínimo *</Label>
									<input type="number" name="stock_minimo" min="0" placeholder="5"
										value={formData.stock_minimo} onChange={onChange}
										className={inputCls(errores.stock_minimo)} />
									{errores.stock_minimo && <p className="text-xs text-[#ba1a1a] mt-1">{errores.stock_minimo}</p>}
								</div>

								{/* Fecha vencimiento */}
								<div>
									<Label optional>Fecha de vencimiento</Label>
									<input type="date" name="fecha_vencimiento"
										value={formData.fecha_vencimiento} onChange={onChange}
										className={inputCls(false)} />
								</div>

								{/* Proveedor */}
								<div className="md:col-span-2">
									<Label>Proveedor *</Label>
									<input type="text" name="proveedor" placeholder="Ej: Dental Plus"
										value={formData.proveedor} onChange={onChange}
										className={inputCls(errores.proveedor)} />
									{errores.proveedor && <p className="text-xs text-[#ba1a1a] mt-1">{errores.proveedor}</p>}
								</div>

							</div>

							<div className="flex justify-end gap-3 pt-2">
								<button type="button" onClick={() => navigate("/inventario")}
									className="px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] transition-colors">
									Cancelar
								</button>
								<button type="submit" disabled={guardando}
									className="px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60">
									{guardando ? (
										<span className="loading loading-spinner loading-xs" />
									) : (
										<><span className="material-symbols-outlined text-[16px]">save</span>Guardar cambios</>
									)}
								</button>
							</div>
						</form>
					</div>

					{/* ── Historial de movimientos ── */}
					<div className="bg-white border border-[#bec8ce] rounded-2xl p-8 shadow-sm mt-6">
						<h3 className="text-sm font-semibold text-[#151c27] mb-4 flex items-center gap-2">
							<span className="material-symbols-outlined text-[#006686] text-[18px]">history</span>
							Historial de movimientos
						</h3>

						{cargandoMovimientos ? (
							<div className="flex justify-center py-8">
								<span className="loading loading-spinner loading-md text-[#006686]" />
							</div>
						) : movimientos.length === 0 ? (
							<div className="text-center py-8">
								<span className="material-symbols-outlined text-4xl text-[#bec8ce] block mb-2">inbox</span>
								<p className="text-sm text-[#3f484e]">Aún no se han registrado movimientos para este insumo.</p>
							</div>
						) : (
							<div className="flex flex-col gap-2">
								{movimientos.map((mov) => {
									const cfg = MOVIMIENTO_CONFIG[mov.tipo] || MOVIMIENTO_CONFIG.ajuste;
									return (
										<div key={mov._id}
											className="flex items-center justify-between bg-[#f9f9ff] rounded-lg px-4 py-3">
											<div className="flex items-center gap-3">
												<div className={`w-7 h-7 rounded-full ${cfg.iconoBg} flex items-center justify-center flex-shrink-0`}>
													<span className={`material-symbols-outlined ${cfg.iconoColor} text-[16px]`}>{cfg.icono}</span>
												</div>
												<div>
													<div className="flex items-center gap-2">
														<p className={`text-sm font-semibold ${cfg.textoColor}`}>
															{cfg.signo}{mov.cantidad} {insumoOriginal.unidad}
														</p>
														<span className="text-[10px] font-semibold uppercase tracking-wider text-[#bec8ce]">
															{cfg.etiqueta}
														</span>
													</div>
													<p className="text-xs text-[#3f484e] mt-0.5">{formatFechaMovimiento(mov.fecha)}</p>
												</div>
											</div>
											<span className="text-sm text-[#3f484e]">→ {mov.stock_resultante}</span>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Toast éxito */}
			{exito && (
				<div className="fixed bottom-6 right-6 z-50">
					<div className="bg-white border border-[#bec8ce] rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px]">
						<div className="bg-[#7dd3fc20] p-3 rounded-xl">
							<span className="material-symbols-outlined text-[#006686]" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
						</div>
						<div className="flex-1">
							<p className="text-sm font-semibold text-[#151c27]">Insumo actualizado correctamente</p>
							<p className="text-xs text-[#3f484e] mt-0.5">La información fue guardada exitosamente</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default EditarInsumo;