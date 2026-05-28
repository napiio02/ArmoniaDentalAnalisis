import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../../components/Navbar";
import { AlertTriangle, ArrowLeft, Save, X } from "lucide-react";
import { insumoService } from "../../services/insumoService";

const EditarInsumo = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [insumoOriginal, setInsumoOriginal] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [error, setError] = useState(null);
	const [formData, setFormData] = useState({
		stock_actual: "",
		stock_minimo: "",
	});

	// ── Cargar insumo por ID ──
	useEffect(() => {
		const fetchInsumo = async () => {
			try {
				const { data } = await insumoService.getById(id);
				setInsumoOriginal(data);
				setFormData({
					stock_actual: data.stock_actual,
					stock_minimo: data.stock_minimo,
				});
			} catch (err) {
				setError("No se encontró el insumo.");
			} finally {
				setCargando(false);
			}
		};

		fetchInsumo();
	}, [id]);

	// ── Guardar cambios ──
	const handleSubmit = async (e) => {
		e.preventDefault();
		setGuardando(true);
		try {
			await insumoService.update(id, {
				stock_actual: Number(formData.stock_actual),
				stock_minimo: Number(formData.stock_minimo),
			});
			navigate("/inventario");
		} catch (err) {
			setError("Error al guardar los cambios.");
			setGuardando(false);
		}
	};

	const stockBajo =
		Number(formData.stock_actual) <= Number(formData.stock_minimo);

	// ── Estados de carga y error ──
	if (cargando) {
		return (
			<div>
				<Navbar />
				<div className="flex justify-center items-center h-64">
					<span className="loading loading-spinner loading-lg text-primary" />
				</div>
			</div>
		);
	}

	if (error || !insumoOriginal) {
		return (
			<div>
				<Navbar />
				<div className="container mx-auto p-8">
					<div className="alert alert-error max-w-md">
						<span>{error || "Insumo no encontrado."}</span>
					</div>
					<button
						className="btn btn-ghost mt-4 gap-2"
						onClick={() => navigate("/inventario")}
					>
						<ArrowLeft size={16} />
						Volver al inventario
					</button>
				</div>
			</div>
		);
	}

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8 max-w-lg mx-auto">
					<h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Insumo</h2>
					<p className="text-gray-600 mb-6">
						Solo se puede modificar el stock actual y el stock mínimo
					</p>

					<div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Editar stock</h3>
							<button
								className="btn btn-ghost btn-sm"
								onClick={() => navigate("/inventario")}
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Info solo lectura */}
						<div className="bg-gray-50 rounded-lg p-3 mb-4">
							<p className="font-semibold text-gray-800">{insumoOriginal.nombre}</p>
							<p className="text-sm text-gray-500">
								{insumoOriginal.codigo} · {insumoOriginal.categoria}
							</p>
						</div>

						<form className="space-y-3" onSubmit={handleSubmit}>
							<div className="grid grid-cols-2 gap-3">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Stock actual *</span>
									</label>
									<input
										type="number"
										min="0"
										className="input input-bordered"
										value={formData.stock_actual}
										onChange={(e) =>
											setFormData((p) => ({ ...p, stock_actual: e.target.value }))
										}
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
										value={formData.stock_minimo}
										onChange={(e) =>
											setFormData((p) => ({ ...p, stock_minimo: e.target.value }))
										}
										required
									/>
								</div>
							</div>

							{stockBajo && (
								<div className="alert alert-warning py-2">
									<AlertTriangle className="w-4 h-4" />
									<span className="text-sm">
										El stock actual sigue siendo menor o igual al mínimo.
									</span>
								</div>
							)}

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
										<><Save size={15} /> Guardar cambios</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EditarInsumo;
