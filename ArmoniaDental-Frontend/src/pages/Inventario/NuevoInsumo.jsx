import { useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../../components/Navbar";
import { Package } from "lucide-react";
import { insumoService } from "../../services/insumoService";

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

const FORM_INICIAL = {
	nombre: "",
	categoria: "",
	stock_actual: "",
	stock_minimo: "",
	unidad: "",
	proveedor: "",
};

const NuevoInsumo = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState(FORM_INICIAL);
	const [guardando, setGuardando] = useState(false);
	const [exito, setExito] = useState(false);
	const [error, setError] = useState(null);

	const onChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setGuardando(true);
		setError(null);
		try {
			await insumoService.create({
				...formData,
				stock_actual: Number(formData.stock_actual),
				stock_minimo: Number(formData.stock_minimo),
			});
			setExito(true);
			setTimeout(() => navigate("/inventario"), 1500);
		} catch (err) {
			setError("Error al guardar el insumo. Intentá de nuevo.");
			setGuardando(false);
		}
	};

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8 max-w-2xl mx-auto">
					<h2 className="text-3xl font-bold text-gray-800 mb-2">Nuevo Insumo</h2>
					<p className="text-gray-600 mb-6">
						Complete el formulario para registrar un nuevo insumo médico
					</p>

					{error && (
						<div className="alert alert-error mb-4">
							<span>{error}</span>
						</div>
					)}

					<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
						<form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

								<div className="form-control md:col-span-2">
									<label className="label">
										<span className="label-text font-medium">Nombre del insumo *</span>
									</label>
									<input
										type="text"
										name="nombre"
										className="input input-bordered"
										placeholder="Ej: Guantes de nitrilo"
										value={formData.nombre}
										onChange={onChange}
										required
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text font-medium">Categoría *</span>
									</label>
									<select
										name="categoria"
										className="select select-bordered"
										value={formData.categoria}
										onChange={onChange}
										required
									>
										<option value="">Seleccionar categoría</option>
										{CATEGORIAS.map((c) => (
											<option key={c} value={c}>{c}</option>
										))}
									</select>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text font-medium">Unidad *</span>
									</label>
									<input
										type="text"
										name="unidad"
										className="input input-bordered"
										placeholder="Ej: Cajas, Unidades, Rollos"
										value={formData.unidad}
										onChange={onChange}
										required
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text font-medium">Stock actual *</span>
									</label>
									<input
										type="number"
										name="stock_actual"
										min="0"
										className="input input-bordered"
										placeholder="0"
										value={formData.stock_actual}
										onChange={onChange}
										required
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text font-medium">Stock mínimo *</span>
									</label>
									<input
										type="number"
										name="stock_minimo"
										min="0"
										className="input input-bordered"
										placeholder="5"
										value={formData.stock_minimo}
										onChange={onChange}
										required
									/>
								</div>

								<div className="form-control md:col-span-2">
									<label className="label">
										<span className="label-text font-medium">Proveedor</span>
									</label>
									<input
										type="text"
										name="proveedor"
										className="input input-bordered"
										placeholder="Ej: Dental Plus"
										value={formData.proveedor}
										onChange={onChange}
									/>
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => navigate("/inventario")}
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
				</div>
			</div>

			{/* Toast de registrado */}
			{exito && (
				<div className="toast toast-bottom toast-end z-50 mr-4 mb-4">
					<div className="bg-white border border-gray-200 rounded-2xl shadow-xl px-6 py-5 flex items-center gap-4 min-w-[320px] max-w-[420px]">
						<div className="bg-green-100 text-green-600 p-3 rounded-xl">
							<Package size={22} />
						</div>
						<div className="flex-1">
							<p className="text-base font-semibold text-gray-800">
								Insumo registrado correctamente
							</p>
							<p className="text-sm text-gray-500 mt-1">
								La información fue guardada exitosamente
							</p>
						</div>
						<button
							onClick={() => setExito(false)}
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

export default NuevoInsumo;
