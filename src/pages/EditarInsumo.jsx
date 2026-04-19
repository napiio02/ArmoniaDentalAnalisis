import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";
import { AlertTriangle, ArrowLeft, Save, X } from "lucide-react";
import { INSUMOS } from "../data/mockData";

const EditarInsumo = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const insumoOriginal = INSUMOS.find((i) => i._id === id);

	const [formData, setFormData] = useState({
		stock_actual: insumoOriginal?.stock_actual ?? "",
		stock_minimo: insumoOriginal?.stock_minimo ?? "",
	});
	const [guardando, setGuardando] = useState(false);

	if (!insumoOriginal) {
		return (
			<div>
				<Navbar />
				<div className="container mx-auto p-8">
					<div className="alert alert-error max-w-md">
						<span>Insumo no encontrado.</span>
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

	const handleSubmit = (e) => {
		e.preventDefault();
		setGuardando(true);
		setTimeout(() => {
			setGuardando(false);
			navigate("/inventario");
		}, 700);
	};

	const stockBajo =
		Number(formData.stock_actual) <= Number(formData.stock_minimo);

	return (
		<div>
			<Navbar />
			<div className="container mx-auto p-8">
				<div className="lg:px-8 max-w-lg mx-auto">

					{/* mismo estilo de encabezado que las otras páginas */}
					<h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Insumo</h2>
					<p className="text-gray-600 mb-6">
						Solo se puede modificar el stock actual y el stock mínimo
					</p>

					{/* Card igual al modal-box de DaisyUI */}
					<div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">

						{/* Encabezado del card con X para volver */}
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Editar stock</h3>
							<button
								className="btn btn-ghost btn-sm"
								onClick={() => navigate("/inventario")}
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Info del insumo (solo lectura) igual al bg-gray-50 del modal */}
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

							{/* Mismos botones que el modal */}
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
										"Guardar cambios"
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
