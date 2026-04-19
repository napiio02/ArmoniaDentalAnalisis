import React from "react";
import { Route, Routes, Navigate } from "react-router";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import NuevoPaciente from "./pages/NuevoPaciente";
import EditarPaciente from "./pages/EditarPaciente";
import VisualizarPaciente from "./pages/VisualizarPaciente";
import Expedientes from "./pages/Expedientes";
import Citas from "./pages/Citas";
import Inventario from "./pages/Inventario";
import EditarInsumo from "./pages/EditarInsumo";
import ControlMarcas from "./pages/ControlMarcas";
// import Comprobantes from "./pages/Comprobantes";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Odontograma from "./pages/Odontograma";
import RecuperarPass from "./pages/RecuperarPass";

const ProtectedRoute = ({ children }) => {
	const isAuthenticated = localStorage.getItem("token");
	return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
	return (
		<div data-theme="emerald">
			<Routes>
				{/* Rutas públicas */}
				<Route path="/login" element={<Login />} />

				<Route path="/recuperar-password" element={<RecuperarPass />} />

				{/* Rutas privadas */}
				<Route
					path="/"
					element={
						<ProtectedRoute>
							<Home />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/pacientes"
					element={
						<ProtectedRoute>
							<Pacientes />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/pacientes-nuevo"
					element={
						<ProtectedRoute>
							<NuevoPaciente />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/pacientes/:id"
					element={
						<ProtectedRoute>
							<VisualizarPaciente />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/pacientes/editar/:id"
					element={
						<ProtectedRoute>
							<EditarPaciente />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/expedientes"
					element={
						<ProtectedRoute>
							<Expedientes />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/citas"
					element={
						<ProtectedRoute>
							<Citas />
						</ProtectedRoute>
					}
				/>
				{ <Route
					path="/inventario"
					element={
						<ProtectedRoute>
							<Inventario />
						</ProtectedRoute>
					}
				/> }
				<Route path="/inventario-editar/:id" 
				element={
				<ProtectedRoute>
					<EditarInsumo />
					</ProtectedRoute>} 
				/>
				<Route
					path="/control-marcas"
					element={
						<ProtectedRoute>
							<ControlMarcas />
						</ProtectedRoute>
					}
				/>
				{/* <Route
					path="/comprobantes"
					element={
						<ProtectedRoute>
							<Comprobantes />
						</ProtectedRoute>
					}
				/> */}
				<Route
					path="/reportes"
					element={
						<ProtectedRoute>
							<Reportes />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/usuarios"
					element={
						<ProtectedRoute>
							<Usuarios />
						</ProtectedRoute>
					}
				/>
				<Route 
				path="/odontograma" 
				element={
				<ProtectedRoute>
					<Odontograma />
					</ProtectedRoute>
				} />
			</Routes>
		</div>
	);
};

export default App;
