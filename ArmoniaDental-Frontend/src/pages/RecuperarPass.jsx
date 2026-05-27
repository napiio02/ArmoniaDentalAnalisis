import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

function RecuperarPass() {
	const [email, setEmail] = useState("");
	const [enviado, setEnviado] = useState(false);
	const [cargando, setCargando] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault();
		setCargando(true);
		// Simulación de envío 
		setTimeout(() => {
			setCargando(false);
			setEnviado(true);
		}, 1000);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 to-emerald-200 relative">
			<div className="absolute inset-0 backdrop-blur-sm bg-white/10"></div>

			<div className="card w-full max-w-md bg-white shadow-2xl z-10 mx-4">
				<div className="card-body">

					{/* Header */}
					<div className="text-center mb-4">
						<div className="text-5xl mb-2">ꨄ︎</div>
						<h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">
							Armonía Dental
						</h1>
					</div>

					{!enviado ? (
						<>
							<h2 className="text-xl font-bold text-gray-700 text-center mb-1">
								Recuperar contraseña
							</h2>
							<p className="text-center text-sm text-gray-500 mb-5">
								Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
							</p>

							<form onSubmit={handleSubmit}>
								<div className="form-control">
									<label className="label">
										<span className="label-text">Correo electrónico</span>
									</label>
									<label className="input input-bordered flex items-center gap-2">
										<Mail className="w-4 h-4 text-gray-400" />
										<input
											type="email"
											placeholder="correo@armoniadental.com"
											className="grow"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
										/>
									</label>
								</div>

								<div className="form-control mt-5">
									<button
										type="submit"
										className="btn btn-secondary"
										disabled={cargando}
									>
										{cargando ? (
											<span className="loading loading-spinner loading-sm" />
										) : (
											"Enviar enlace de recuperación"
										)}
									</button>
								</div>
							</form>
						</>
					) : (
						/* Pantalla de éxito */
						<div className="text-center py-4">
							<CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
							<h2 className="text-xl font-bold text-gray-700 mb-2">
								¡Correo enviado!
							</h2>
							<p className="text-sm text-gray-500 mb-2">
								Si el correo <span className="font-semibold text-gray-700">{email}</span> está registrado, recibirás un enlace para restablecer tu contraseña.
							</p>
							<p className="text-xs text-gray-400 mb-6">
								Revisá también tu carpeta de spam.
							</p>
						</div>
					)}

					{/* Volver al login */}
					<div className="divider text-xs text-gray-400">o</div>
					<Link
						to="/login"
						className="btn btn-ghost btn-sm gap-2 w-full"
					>
						<ArrowLeft className="w-4 h-4" />
						Volver al inicio de sesión
					</Link>

				</div>
			</div>
		</div>
	);
}

export default RecuperarPass;