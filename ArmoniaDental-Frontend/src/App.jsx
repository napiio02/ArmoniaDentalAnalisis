import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router";

import { obtenerSesion } from "./services/authService";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes/Pacientes";
import NuevoPaciente from "./pages/Pacientes/NuevoPaciente";
import EditarPaciente from "./pages/Pacientes/EditarPaciente";
import VisualizarPaciente from "./pages/Pacientes/VisualizarPaciente";
import Expedientes from "./pages/Expedientes";
import Citas from "./pages/Citas";
import Inventario from "./pages/Inventario/Inventario";
import NuevoInsumo from "./pages/Inventario/NuevoInsumo";
import EditarInsumo from "./pages/Inventario/EditarInsumo";
import ControlMarcas from "./pages/ControlMarcas";
import Comprobantes from "./pages/Comprobantes";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Odontograma from "./pages/Odontograma/Odontograma";
import RecuperarPass from "./pages/RecuperarPass";

const ProtectedRoute = ({ children }) => {
  const [estadoSesion, setEstadoSesion] = useState("cargando");

  useEffect(() => {
    let componenteActivo = true;

    const validarSesion = async () => {
      try {
        const resultado = await obtenerSesion();

        if (!componenteActivo) {
          return;
        }

        localStorage.setItem(
          "usuario",
          JSON.stringify(resultado.data.usuario)
        );

        setEstadoSesion("autenticado");
      } catch (error) {
        if (!componenteActivo) {
          return;
        }

        localStorage.removeItem("usuario");
        setEstadoSesion("no-autenticado");
      }
    };

    validarSesion();

    return () => {
      componenteActivo = false;
    };
  }, []);

  if (estadoSesion === "cargando") {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-[#006686]" />

          <p className="text-sm text-[#3f484e] mt-3">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  if (estadoSesion === "no-autenticado") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <div data-theme="emerald">
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/recuperar-password"
          element={<RecuperarPass />}
        />

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

        <Route
          path="/inventario"
          element={
            <ProtectedRoute>
              <Inventario />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventario-nuevo"
          element={
            <ProtectedRoute>
              <NuevoInsumo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventario-editar/:id"
          element={
            <ProtectedRoute>
              <EditarInsumo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/control-marcas"
          element={
            <ProtectedRoute>
              <ControlMarcas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/comprobantes"
          element={
            <ProtectedRoute>
              <Comprobantes />
            </ProtectedRoute>
          }
        />

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
          }
        />

        {/* Ruta desconocida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;