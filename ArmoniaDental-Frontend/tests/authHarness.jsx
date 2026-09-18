import React from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";
import ProtectedRoute from "../src/auth/ProtectedRoute";
import Sidebar from "../src/components/Sidebar";

export const control = {};
function Location() {
  const location = useLocation();
  control.navigate = useNavigate();
  control.auth = useAuth();
  return <output id="ruta-actual">{location.pathname}</output>;
}
function Page({ nombre }) {
  return <><Sidebar /><p id="pantalla">{nombre}</p></>;
}
export function Harness({ ruta = "/citas" }) {
  return <MemoryRouter initialEntries={[ruta]}><AuthProvider>
    <Location />
    <Routes>
      <Route path="/login" element={<p id="pantalla">Login</p>} />
      {["/", "/citas", "/pacientes", "/control-marcas", "/administracion/usuarios", "/comprobantes", "/reportes"].map((ruta) =>
        <Route key={ruta} path={ruta} element={<ProtectedRoute><Page nombre={ruta} /></ProtectedRoute>} />)}
    </Routes>
  </AuthProvider></MemoryRouter>;
}
