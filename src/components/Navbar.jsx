import { Link, useNavigate } from "react-router";
import { Menu, User } from "lucide-react";
import { useEffect, useState } from "react";

const Navbar = () => {
	const navigate = useNavigate();
	const [usuario, setUsuario] = useState(null);

	useEffect(() => {
		const usuarioGuardado = localStorage.getItem("usuario");
		if (usuarioGuardado) {
			setUsuario(JSON.parse(usuarioGuardado));
		}
	}, []);

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("usuario");
		setUsuario(null);
		navigate("/login");
	};

	return (
		<div className="navbar bg-gradient-to-r to-primary from-sky-300 px-8">
			<div className="navbar-start">
				<div className="dropdown">
					<div
						tabIndex={0}
						role="button"
						className="btn btn-ghost btn-sm px-1 mr-2 lg:hidden"
					>
						<Menu></Menu>
					</div>
					<ul
						tabIndex={0}
						className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
					>
						<li>
							<Link to={"/pacientes"}>Pacientes</Link>
						</li>
						<li>
							<Link to={"/expedientes"}>Expedientes</Link>
						</li>
						<li>
							<Link to={"/citas"}>Citas</Link>
						</li>
						<li>
							<Link to={"/inventario"}>Inventario</Link>
						</li>
						<li>
							<Link to={"/control-marcas"}>Control de Marcas</Link>
						</li>
						<li>
							<Link to={"/comprobantes"}>Comprobantes</Link>
						</li>
						<li>
							<Link to={"/reportes"}>Reportes</Link>
						</li>
						<li>
							<Link to={"/usuarios"}>Usuarios</Link>
						</li>
					</ul>
				</div>
				<Link to={"/"} className="font-bold text-2xl">
					Armonía Dental
				</Link>
			</div>
			<div className="navbar-center hidden lg:flex">
				<ul className="menu menu-horizontal px-1">
					<li>
						<details>
							<summary>Expedientes</summary>
							<ul className="p-2">
								<li>
									<Link to={"/pacientes"}>Pacientes</Link>
								</li>
								<li>
									<Link to={"/expedientes"}>Historial Clínico</Link>
								</li>
								<li>
									<Link to={"/odontograma"}>Odontograma</Link>  {/* ← dentro del ul */}
								</li>
							</ul>
						</details>
					</li>
					<li>
						<Link to={"/citas"}>Citas</Link>
					</li>
					<li>
						<Link to={"/inventario"}>Inventario</Link>
					</li>
					<li>
						<details>
							<summary>Administración</summary>
							<ul className="p-2">
								<li>
									<Link to={"/control-marcas"}>Control de Marcas</Link>
								</li>
								<li>
									<Link to={"/comprobantes"}>Comprobantes</Link>
								</li>
								<li>
									<Link to={"/reportes"}>Reportes</Link>
								</li>
							</ul>
						</details>
					</li>
					<li>
						<Link to={"/usuarios"}>Usuarios</Link>
					</li>
				</ul>
			</div>
			<div className="navbar-end gap-3">
				{usuario && (
					<div className="hidden lg:flex items-center gap-2">
						<User className="w-5 h-5" />
						<span className="font-semibold">{usuario.nombre}</span>
					</div>
				)}
				<button
					onClick={handleLogout}
					className="btn btn-outline btn-sm lg:btn-md"
				>
					Cerrar Sesión
				</button>
			</div>
		</div>
	);
};

export default Navbar;
