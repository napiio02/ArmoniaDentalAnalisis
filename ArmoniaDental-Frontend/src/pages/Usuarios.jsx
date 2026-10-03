import { useAuth } from "../auth/AuthContext";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ModalConfirmarEliminar from "../components/ModalConfirmarEliminar";
import {
  listarUsuarios, listarRoles, obtenerUsuario, crearUsuario,
  editarUsuario, cambiarEstadoUsuario, eliminarUsuario,
} from "../services/usuarioService";

const BADGE_ROL = {
  Dentista: "bg-[#7dd3fc20] text-[#006686] border-[#006686]/20",
  "Asistente Dental": "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/30",
  Admin: "bg-[#ffddb820] text-[#855300] border-[#855300]/20",
};
const inputCls = "w-full px-4 py-2.5 border border-[#bec8ce] rounded-lg text-sm focus:outline-none focus:border-[#006686] bg-white text-[#151c27] disabled:opacity-60";
const botonSecundario = "px-5 py-2.5 text-xs font-semibold text-[#3f484e] bg-[#f0f3ff] border border-[#bec8ce] rounded-full hover:bg-[#dce2f3] disabled:opacity-60";
const botonPrincipal = "px-6 py-2.5 bg-[#006686] text-white rounded-full text-xs font-semibold hover:opacity-90 disabled:opacity-60 flex items-center gap-2";
const FORM_INICIAL = { nombre: "", email: "", cedula: "", telefono: "", rol_id: "", password: "", confirmarPassword: "", activo: true };
const CAMPOS = [
  { name: "nombre", label: "Nombre completo", type: "text" },
  { name: "cedula", label: "Cédula", type: "text" },
  { name: "email", label: "Correo electrónico", type: "email" },
  { name: "telefono", label: "Teléfono", type: "tel" },
];
const nombreRolDe = (usuario) => usuario?.rol_id?.nombre || "Sin rol";
const getInitials = (nombre = "") => (nombre || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
const formatearFecha = (valor) => valor ? new Date(valor).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" }) : "—";
const Label = ({ children, htmlFor }) => <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#3f484e] uppercase tracking-wider mb-1.5">{children}</label>;
const ErrorMensaje = ({ mensaje }) => mensaje && <p role="alert" className="rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">{mensaje}</p>;

function ModalUsuario({ titulo, onCerrar, ocupado, children }) {
  useEffect(() => {
    const cerrar = (event) => { if (event.key === "Escape" && !ocupado) onCerrar(); };
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [onCerrar, ocupado]);
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-usuario" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#bec8ce]">
        <h3 id="titulo-usuario" className="text-lg font-bold text-[#151c27]">{titulo}</h3>
        <button type="button" onClick={onCerrar} disabled={ocupado} aria-label="Cerrar" className="text-[#3f484e] hover:text-[#006686] disabled:opacity-60"><span className="material-symbols-outlined">close</span></button>
      </div>{children}
    </div>
  </div>;
}

export default function Usuarios() {
  const { usuario: usuarioConectado } = useAuth();
  const esCuentaPropia = (u) => u?._id === usuarioConectado?._id;
  const esAdmin = (u) => u?.rol_id?.nombre === "Admin";
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todo");
  const [rolFiltro, setRolFiltro] = useState("todo");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({ ...FORM_INICIAL });
  const [errorFormulario, setErrorFormulario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState("");
  const [confirmacion, setConfirmacion] = useState(null);
  const [errorConfirmacion, setErrorConfirmacion] = useState("");

  useEffect(() => {
    let activo = true;
    (async () => {
      const [resUsuarios, resRoles] = await Promise.allSettled([listarUsuarios(), listarRoles()]);
      if (!activo) return;
      if (resUsuarios.status === "fulfilled") setUsuarios(resUsuarios.value);
      if (resRoles.status === "fulfilled") setRoles(resRoles.value);
      const errores = [resUsuarios, resRoles].filter((r) => r.status === "rejected").map((r) => r.reason.message);
      setError(errores.join(" "));
      setCargando(false);
    })();
    return () => { activo = false; };
  }, []);

  const cerrarFormulario = () => { setMostrarModal(false); setForm({ ...FORM_INICIAL }); };
  const abrirCrear = () => {
    setUsuarioEditando(null); setForm({ ...FORM_INICIAL }); setErrorFormulario(""); setMostrarModal(true);
  };
  const abrirUsuario = async (usuario, editar = false) => {
    setError(""); setCargandoUsuario(usuario._id);
    try {
      const datos = await obtenerUsuario(usuario._id);
      if (editar) {
        setUsuarioEditando(datos);
        setForm({ ...FORM_INICIAL, nombre: datos.nombre || "", email: datos.email || "", cedula: datos.cedula || "", telefono: datos.telefono || "", rol_id: datos.rol_id?._id || "", activo: Boolean(datos.activo) });
        setErrorFormulario(""); setMostrarModal(true);
      } else setDetalle(datos);
    } catch (err) { setError(err.message); setMensaje(""); }
    finally { setCargandoUsuario(""); }
  };
  const actualizarLista = (usuario) => setUsuarios((lista) => lista.some((u) => u._id === usuario._id)
    ? lista.map((u) => u._id === usuario._id ? usuario : u) : [usuario, ...lista]);
  const handleGuardar = async (event) => {
    event.preventDefault(); setErrorFormulario("");
    if (!usuarioEditando && form.password !== form.confirmarPassword) { setErrorFormulario("Las contraseñas no coinciden."); return; }
    setGuardando(true);
    try {
      const datos = { nombre: form.nombre.trim(), email: form.email.trim(), cedula: form.cedula.trim(), telefono: form.telefono.trim(), rol_id: form.rol_id, activo: form.activo, ...(!usuarioEditando ? { password: form.password } : {}) };
      const resultado = usuarioEditando ? await editarUsuario(usuarioEditando._id, datos) : await crearUsuario(datos);
      actualizarLista(resultado.usuario); setMensaje(resultado.message); setError(""); cerrarFormulario();
    } catch (err) { setErrorFormulario(err.message || "No se pudo guardar el usuario."); }
    finally { setGuardando(false); }
  };
  const pedirConfirmacion = (usuario, accion) => { setConfirmacion({ usuario, accion }); setErrorConfirmacion(""); };
  const confirmarAccion = async () => {
    setGuardando(true); setErrorConfirmacion("");
    try {
      const { usuario, accion } = confirmacion;
      const resultado = accion === "eliminar" ? await eliminarUsuario(usuario._id) : await cambiarEstadoUsuario(usuario._id, !usuario.activo);
      if (accion === "eliminar") setUsuarios((lista) => lista.filter((u) => u._id !== usuario._id));
      else actualizarLista(resultado.usuario);
      setMensaje(resultado.message); setError(""); setConfirmacion(null);
    } catch (err) { setErrorConfirmacion(err.message || "No se pudo completar la operación."); }
    finally { setGuardando(false); }
  };
  const filtrados = usuarios.filter((u) => {
    const term = busqueda.trim().toLowerCase();
    return (!term || [u.nombre, u.email, u.cedula].some((v) => (v || "").toLowerCase().includes(term)))
      && (estadoFiltro === "todo" || (estadoFiltro === "activo" ? u.activo : !u.activo))
      && (rolFiltro === "todo" || u.rol_id?._id === rolFiltro);
  });
  const cambioForm = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const accionConfirmacion = confirmacion?.accion === "eliminar" ? "Eliminar" : confirmacion?.usuario.activo ? "Desactivar" : "Activar";

  return <div className="flex overflow-hidden h-screen bg-[#f9f9ff] font-[Nunito_Sans,sans-serif]">
    <Sidebar activeItem="usuarios" />
    <main className="flex-1 h-screen overflow-y-auto p-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div><p className="text-xs font-semibold text-[#006686] uppercase tracking-wider mb-1">Administración</p><h2 className="text-[28px] font-bold leading-[36px] text-[#151c27]">Usuarios</h2><p className="text-sm text-[#3f484e] mt-1">Gestión del personal de Armonía Dental</p></div>
          <button type="button" onClick={abrirCrear} disabled={cargando || roles.length === 0} className={botonPrincipal}><span className="material-symbols-outlined text-[18px]">person_add</span>Registrar Usuario</button>
        </div>
        {mensaje && <p role="status" className="mb-5 rounded-xl border border-[#6df5e1]/30 bg-[#6df5e120] px-5 py-3 text-sm text-[#006b5f]">{mensaje}</p>}
        <div className="mb-5"><ErrorMensaje mensaje={error} /></div>
        {!cargando && roles.length === 0 && <p className="mb-5 text-sm text-[#855300]">No hay roles disponibles. Revise los roles Admin, Dentista y Asistente Dental en el sistema.</p>}
        <div className="bg-white border border-[#bec8ce] rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#3f484e] text-[18px]">search</span><input aria-label="Buscar usuarios" placeholder="Buscar por nombre, correo o cédula..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} pl-10`} /></div>
          <select aria-label="Filtrar por rol" value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value)} className={inputCls}><option value="todo">Todos los roles</option>{roles.map((r) => <option key={r._id} value={r._id}>{r.nombre}</option>)}</select>
          <select aria-label="Filtrar por estado" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className={inputCls}><option value="todo">Todos los estados</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select>
        </div>
        <div className="bg-white border border-[#bec8ce] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {cargando ? <p className="text-center py-16 text-sm text-[#3f484e]">Cargando usuarios…</p> : filtrados.length === 0 ? <div className="text-center py-16"><span className="material-symbols-outlined text-5xl text-[#bec8ce] block mb-3">group</span><p className="text-sm text-[#3f484e]">No se encontraron usuarios</p></div> :
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-[#f0f3ff] border-b border-[#bec8ce]">{["#", "Nombre", "Cédula", "Correo", "Teléfono", "Rol", "Estado cuenta", "Activo", "Acciones"].map((h) => <th key={h} className="px-5 py-3 text-[10px] font-semibold text-[#3f484e] uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-[#bec8ce]/40">{filtrados.map((usuario, index) => <tr key={usuario._id} className={`hover:bg-[#e7eefe]/30 transition-colors ${!usuario.activo ? "opacity-60" : ""}`}>
                  <td className="px-5 py-4 text-sm text-[#3f484e]">{index + 1}</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#7dd3fc20] border border-[#006686]/20 flex items-center justify-center text-[#006686] font-bold text-xs flex-shrink-0">{getInitials(usuario.nombre)}</div><span className="text-sm font-semibold text-[#151c27] whitespace-nowrap">{usuario.nombre || "Sin nombre"}</span></div></td>
                  {[usuario.cedula, usuario.email, usuario.telefono].map((v, i) => <td key={i} className="px-5 py-4 text-sm text-[#3f484e] whitespace-nowrap">{v || "—"}</td>)}
                  <td className="px-5 py-4"><span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${BADGE_ROL[nombreRolDe(usuario)] || "bg-[#dce2f3] text-[#3f484e] border-[#bec8ce]"}`}>{nombreRolDe(usuario)}</span></td>
                  <td className="px-5 py-4 text-sm text-[#3f484e]">{usuario.estado_cuenta || "—"}</td>
                  <td className="px-5 py-4"><span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${usuario.activo ? "bg-[#6df5e120] text-[#006b5f] border-[#6df5e1]/30" : "bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/20"}`}>{usuario.activo ? "Activo" : "Inactivo"}</span></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-1">{[
                    { icon: "visibility", label: "Ver información", click: () => abrirUsuario(usuario) },
                    { icon: "edit", label: "Editar usuario", click: () => abrirUsuario(usuario, true) },
                    { icon: usuario.activo ? "person_off" : "person_check", label: usuario.activo ? "Desactivar usuario" : "Activar usuario", disabled: esCuentaPropia(usuario) || esAdmin(usuario), click: () => pedirConfirmacion(usuario, "estado") },
                    { icon: "delete", label: "Eliminar usuario", disabled: esCuentaPropia(usuario) || esAdmin(usuario), click: () => pedirConfirmacion(usuario, "eliminar") },
                  ].map((a) => <button key={a.label} type="button" title={a.label} aria-label={`${a.label}: ${usuario.nombre}`} onClick={a.click} disabled={Boolean(cargandoUsuario) || guardando || a.disabled} className={`p-2 rounded-lg hover:bg-[#f0f3ff] disabled:opacity-40 ${a.icon === "delete" ? "text-[#ba1a1a]" : "text-[#006686]"}`}><span className="material-symbols-outlined text-[20px]">{a.icon}</span></button>)}</div></td>
                </tr>)}</tbody>
              </table>}
          </div>
        </div>
      </div>
    </main>
    {mostrarModal && <ModalUsuario titulo={usuarioEditando ? "Editar usuario" : "Registrar usuario"} ocupado={guardando} onCerrar={cerrarFormulario}>
      <form onSubmit={handleGuardar} className="p-6 space-y-5">
        <ErrorMensaje mensaje={errorFormulario} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {CAMPOS.map((campo, index) => <div key={campo.name}><Label htmlFor={`usuario-${campo.name}`}>{campo.label}</Label><input id={`usuario-${campo.name}`} name={campo.name} type={campo.type} required autoFocus={index === 0} value={form[campo.name]} disabled={guardando} className={inputCls} onChange={(e) => cambioForm(campo.name, e.target.value)} /></div>)}
          <div><Label htmlFor="usuario-rol">Rol</Label><select id="usuario-rol" required value={form.rol_id} disabled={guardando || esAdmin(usuarioEditando)} className={inputCls} onChange={(e) => cambioForm("rol_id", e.target.value)}><option value="">Seleccione un rol</option>{usuarioEditando?.rol_id && !roles.some((r) => r._id === usuarioEditando.rol_id._id) && <option value={usuarioEditando.rol_id._id} disabled>{usuarioEditando.rol_id.nombre} (no disponible)</option>}{roles.map((r) => <option key={r._id} value={r._id} disabled={r.nombre === "Admin" && !esAdmin(usuarioEditando)}>{r.nombre}</option>)}</select></div>
          <div><Label htmlFor="usuario-activo">Estado del usuario</Label><select id="usuario-activo" value={String(form.activo)} disabled={guardando || esCuentaPropia(usuarioEditando) || esAdmin(usuarioEditando)} className={inputCls} onChange={(e) => cambioForm("activo", e.target.value === "true")}><option value="true">Activo</option><option value="false">Inactivo</option></select></div>
          {!usuarioEditando && [{ name: "password", label: "Contraseña inicial" }, { name: "confirmarPassword", label: "Confirmar contraseña" }].map((campo) => <div key={campo.name}><Label htmlFor={`usuario-${campo.name}`}>{campo.label}</Label><input id={`usuario-${campo.name}`} type="password" autoComplete="new-password" required minLength={8} value={form[campo.name]} disabled={guardando} className={inputCls} onChange={(e) => cambioForm(campo.name, e.target.value)} /></div>)}
        </div>
        <p className="text-xs text-[#3f484e]">{usuarioEditando ? "La edición conserva la contraseña y el estado de registro de la cuenta." : "Use una contraseña de al menos 8 caracteres. El usuario podrá iniciar sesión si su cuenta está activa."}</p>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#bec8ce]"><button type="button" disabled={guardando} onClick={cerrarFormulario} className={botonSecundario}>Cancelar</button><button type="submit" disabled={guardando || roles.length === 0} className={botonPrincipal}>{guardando && <span className="loading loading-spinner loading-xs" />}{guardando ? "Guardando..." : "Guardar usuario"}</button></div>
      </form>
    </ModalUsuario>}
    {detalle && <ModalUsuario titulo="Información del usuario" ocupado={false} onCerrar={() => setDetalle(null)}>
      <div className="p-6"><dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">{[
        ["Nombre", detalle.nombre], ["Cédula", detalle.cedula], ["Correo", detalle.email], ["Teléfono", detalle.telefono],
        ["Rol", nombreRolDe(detalle)], ["Estado del usuario", detalle.activo ? "Activo" : "Inactivo"], ["Estado de cuenta", detalle.estado_cuenta],
        ["Fecha de creación", formatearFecha(detalle.createdAt)], ["Fecha de activación", formatearFecha(detalle.fecha_activacion)], ["Último acceso", formatearFecha(detalle.ultimo_acceso)],
      ].map(([label, valor]) => <div key={label}><dt className="text-xs font-semibold text-[#3f484e] uppercase tracking-wider">{label}</dt><dd className="text-sm text-[#151c27] mt-1 break-words">{valor || "—"}</dd></div>)}</dl><div className="flex justify-end mt-6 pt-4 border-t border-[#bec8ce]"><button type="button" onClick={() => setDetalle(null)} className={botonPrincipal}>Cerrar</button></div></div>
    </ModalUsuario>}
    <ModalConfirmarEliminar open={Boolean(confirmacion)} titulo={`${accionConfirmacion} usuario`}
      mensaje={<>{confirmacion?.accion === "eliminar" ? `¿Desea eliminar permanentemente a ${confirmacion.usuario.nombre}? Esta acción no se puede deshacer. Si tiene registros asociados, deberá desactivarlo para conservar su historial.` : `¿Desea ${accionConfirmacion.toLowerCase()} a ${confirmacion?.usuario.nombre}?`}
        {confirmacion?.accion === "estado" && !confirmacion.usuario.activo && confirmacion.usuario.estado_cuenta !== "Activa" && " La cuenta conservará su estado de registro y deberá completarse o desbloquearse para iniciar sesión."}
        {errorConfirmacion && <span role="alert" className="block text-[#ba1a1a] mt-3">{errorConfirmacion}</span>}
      </>}
      textoConfirmar={accionConfirmacion} icono={confirmacion?.accion === "eliminar" ? "delete" : confirmacion?.usuario.activo ? "person_off" : "person_check"}
      variante={confirmacion?.accion === "eliminar" || confirmacion?.usuario.activo ? "peligro" : "normal"}
      eliminando={guardando} onConfirmar={confirmarAccion} onCancelar={() => setConfirmacion(null)} />
  </div>;
}
