import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Ban } from "lucide-react";

function Login() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState("");

	const { email, password } = formData;

	const onChange = (e) => {
		setFormData((prevState) => ({
			...prevState,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");

		// Credenciales de demostración
		if (email === "admin@armoniadental.com" && password === "1234") {
			const usuario = {
				_id: "u4",
				nombre: "Admin Sistema",
				email: "admin@armoniadental.com",
				rol: "Admin",
			};
			localStorage.setItem("token", "demo-token-armonia-dental");
			localStorage.setItem("usuario", JSON.stringify(usuario));
			navigate("/");
		} else if (email === "laura@armoniadental.com" && password === "1234") {
			const usuario = {
				_id: "u1",
				nombre: "Laura Ureña Rodríguez",
				email: "laura@armoniadental.com",
				rol: "Dentista",
			};
			localStorage.setItem("token", "demo-token-armonia-dental");
			localStorage.setItem("usuario", JSON.stringify(usuario));
			navigate("/");
		} else {
			setError("Credenciales inválidas. Use admin@armoniadental.com / 1234");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 to-emerald-200 relative">
			<div className="absolute inset-0 backdrop-blur-sm bg-white/10"></div>

			<div className="card w-full max-w-md bg-white shadow-2xl z-10 mx-4">
				<div className="card-body">
					<div className="text-center mb-2">
						<div className="text-5xl mb-2">ꨄ︎</div>
						<br />
						<h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">
							Armonía Dental
						</h1>
						<p className="text-gray-500 text-sm mt-1">Sistema de gestión clínica</p>
					</div>

					<h2 className="text-xl font-bold text-center text-gray-700 mb-2">
						Iniciar Sesión
					</h2>

					<p className="text-center text-sm text-gray-500 mb-4">
						Ingrese su correo y contraseña para acceder al sistema
					</p>

					{error && (
						<div role="alert" className="alert alert-error">
							<Ban></Ban>
							<span>{error}</span>
						</div>
					)}

					<div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-3 text-sm text-sky-700">
						<p className="font-semibold mb-1">Credenciales de demo:</p>
						<p>📧 admin@armoniadental.com</p>
						<p>🔑 1234</p>
					</div>

					<form onSubmit={handleSubmit}>
						<div className="form-control">
							<label className="label">
								<span className="label-text">Correo</span>
							</label>
							<input
								type="email"
								placeholder="correo@armoniadental.com"
								className="input input-bordered"
								name="email"
								value={email}
								onChange={onChange}
								required
							/>
						</div>

						<div className="form-control mt-4">
							<label className="label">
								<span className="label-text">Contraseña</span>
							</label>
							<input
								type="password"
								name="password"
								value={password}
								placeholder="Ingrese su contraseña"
								className="input input-bordered"
								onChange={onChange}
								required
							/>
							<label className="label">
								<Link
									to={`/recuperar-password`}
									className="label-text-alt link link-hover italic"
								>
									¿Olvidaste la contraseña?
								</Link>
							</label>
						</div>

						<div className="form-control mt-2">
							<button type="submit" className="btn btn-secondary">
								Ingresar
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default Login;
