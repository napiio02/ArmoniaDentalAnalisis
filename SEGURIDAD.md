# Seguridad, roles y sesiones de Armonía Dental

## Mecanismo implementado

Se conserva el JWT dentro de la cookie HttpOnly `auth_token` y el soporte de `Authorization: Bearer` para clientes de API. El JWT ahora contiene `userId`, `sid` y `version`, y tiene la duración indicada por `JWT_EXPIRES_IN` (8 horas por defecto). La cookie expira al mismo tiempo.

La nueva colección MongoDB `sesiones` registra el identificador, usuario, versión, vencimiento y revocación. `verifyToken` consulta tanto esa colección como `usuarios` y su rol en cada petición privada: comprueba firma/expiración del JWT, sesión persistente vigente, coincidencia de usuario/versión, cuenta activa y registrada, y rol activo reconocido. El rol declarado por el cliente o por un JWT antiguo no concede permisos.

`usuarios.session_version` comienza en 0; los documentos existentes sin el campo funcionan con ese valor. Desactivar o cambiar el rol incrementa la versión atómicamente, revoca todas las sesiones del usuario y elimina enlaces de recuperación pendientes. Reactivar conserva la versión incrementada y exige un nuevo login. Restablecer la contraseña también incrementa la versión y revoca todas las sesiones. Cerrar sesión revoca el `sid` específico antes de borrar la cookie. Reutilizar esa cookie/JWT no restaura el acceso.

El Admin adquiere un único documento `admin:<usuarioId>` mediante un upsert condicionado. El `_id` único impide que dos logins simultáneos obtengan sesiones administrativas. Solo se reutiliza el documento cuando la sesión está revocada, vencida o pertenece a una versión anterior del usuario. El nuevo login reemplaza el `sid`; un logout tardío del token anterior no afecta la sesión nueva. Para Dentista y Asistente se permiten sesiones simultáneas y todas se invalidan al desactivar su cuenta.

Un índice TTL limpia sesiones vencidas; la validación y liberación del Admin comprueban las fechas directamente y no dependen del momento de esa limpieza. Las sesiones persisten aunque se reinicie el backend.

En el frontend se consulta `/auth/me` antes de montar cada ruta privada, incluso con navegación directa o recarga. Los permisos del Sidebar proceden de esa respuesta, no de `localStorage`. La última ruta autorizada se guarda por usuario en `sessionStorage`; ante una ruta prohibida se vuelve allí o al inicio, y aparece el popup de acceso denegado. Se consulta la sesión cada 10 segundos con la pestaña visible y al recuperar foco/visibilidad. Las respuestas `SESSION_INVALID` de peticiones Fetch y Axios expulsan al usuario inmediatamente. Si el servidor no puede validar, se detiene el acceso y se ofrece reintentar. El backend rechaza cada petición nueva con sesión revocada aunque el frontend todavía no haya realizado su siguiente consulta.

| Rol | Usuarios | Comprobantes | Otros módulos |
| --- | --- | --- | --- |
| Admin | Sí | Sí, incluidas creación y envío | Sí |
| Dentista | No | Sí | Sí |
| Asistente Dental | No | No, incluidos detalle/PDF/envío | Sí |

El CRUD administrativo y la lista de roles son exclusivos del Admin. El endpoint autenticado `/v1/personal` devuelve únicamente identificadores, nombres, estado y rol para los selectores de Citas y Control de Marcas, sin exponer la administración de usuarios. Admin tiene también la visibilidad y revisión de marcas que antes estaban limitadas a Dentista. Se conservan las reglas operativas existentes de marcas para Asistente.

Ningún usuario puede desactivarse. El servidor protege tanto `PATCH /users/:id/status` como `PUT /users/:id`. Tampoco permite eliminar, desactivar o cambiar el rol del Admin único ni crear/promover otro Admin. Los campos ajenos al CRUD permitido, como `password_hash`, `estado_cuenta` y `session_version`, no son editables desde esas peticiones. La finalización heredada de registros de asistentes (`/auth/registro`) requiere ahora una sesión Admin.

## Arranque y configuración

1. Instalar dependencias en ambas carpetas con `npm.cmd install`.
2. Mantener `MONGO_URI`, `JWT_SECRET` y `FRONTEND_URL` del backend. `JWT_EXPIRES_IN` es opcional (por ejemplo `8h`). En producción usar `NODE_ENV=production` y HTTPS para la cookie Secure/SameSite=None.
3. Para probar localmente, definir en el frontend `VITE_API_URL=http://localhost:3000/v1` si el backend utiliza el puerto 3000. Adaptar puerto y versión a su configuración; reiniciar Vite después de cambiar la variable.
4. Iniciar el backend con `npm.cmd start` y el frontend con `npm.cmd run dev`.

Antes de escuchar conexiones, el backend exige exactamente un rol Admin activo y exactamente un usuario con ese rol, activo, con cuenta Activa y contraseña. Instala el índice parcial único `administrador_unico` sobre `usuarios.rol_id`, limitado al ID del rol Admin, y los índices de sesiones. Así MongoDB impide duplicados incluso con peticiones concurrentes.

Si la base ya contiene varios Admin, ninguno, un rol duplicado o un Admin deshabilitado/sin registro completo, el arranque se detiene con un mensaje explícito. No se eliminan ni se eligen cuentas automáticamente: se debe resolver esa condición en MongoDB antes de arrancar. La cuenta de conexión necesita permiso para crear los índices. Los JWT emitidos antes de esta implementación carecen de `sid` y serán rechazados; todos deben iniciar sesión nuevamente tras actualizar.

El webhook de WhatsApp es una entrada externa de Meta y no usa sesiones de empleados. GET conserva su token de verificación; POST exige la firma `x-hub-signature-256`, calculada sobre los bytes originales mediante HMAC-SHA256 y `WHATSAPP_APP_SECRET`. Configurar ese secreto de la aplicación de Meta si se utiliza WhatsApp; no es el access token ni `WHATSAPP_VERIFY_TOKEN`. Sin el secreto, POST responde 503 y no procesa citas; con firma ausente/incorrecta responde 403. [Referencia oficial de Meta/WhatsApp](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/).

## Pruebas manuales con dos navegadores

Usar Chrome como navegador A y Firefox/Edge como B, o perfiles realmente separados. Dos pestañas del mismo perfil comparten cookie y pertenecen a la misma sesión.

1. **Admin y sesión única:** iniciar Admin en A. Intentar iniciar el mismo Admin en B: debe responder que ya existe una sesión administrativa activa. A debe seguir funcionando. Cerrar sesión desde el botón en A; iniciar Admin en B debe funcionar. Para comprobar expiración en desarrollo, arrancar el backend con `JWT_EXPIRES_IN=60s`, iniciar Admin en A, esperar más de 60 segundos y probar B; restaurar después la duración normal.
2. **Dentista:** dejar Admin en A y crear/usar un Dentista en B. Abrir el desplegable Administración: Usuarios no aparece y Comprobantes sí. Entrar a Pacientes y escribir `/administracion/usuarios` en B: debe volver a Pacientes y mostrar “Acceso denegado. Por favor comuníquese con la administración para solicitar asistencia.” Repetir con `/usuarios` y una recarga en la URL prohibida. Probar Comprobantes: debe abrir normalmente.
3. **Asistente:** cerrar sesión del Dentista en B e iniciar Asistente. Usuarios y Comprobantes no aparecen. Desde Citas, escribir cada URL prohibida y recargar: debe volver a Citas con el popup. Los demás módulos deben abrir normalmente.
4. **Autodesactivación y conservación del Admin:** en A, los controles de desactivar/eliminar la cuenta propia están deshabilitados y su rol no se puede cambiar. Mediante una petición manual autenticada, enviar `PATCH /v1/users/<id-admin>/status` o `PUT /v1/users/<id-admin>` con `{ "activo": false }`: ambos deben rechazarse. Intentar eliminarlo, cambiar su rol, crear otro Admin o promover otro usuario: también se rechaza. Se puede editar nombre/correo/teléfono del Admin sin quitarle su rol.
5. **Desactivación en vivo:** en B iniciar un Dentista/Asistente y dejar abierta Citas o Inventario. En A desactivarlo desde Usuarios. B debe ir a Login en la siguiente comprobación (hasta unos 10 segundos con la pestaña visible), al recuperar el foco o inmediatamente al intentar una petición protegida. Probar recarga y abrir otra pestaña: no debe obtener acceso. Se pueden iniciar varias sesiones de Dentista/Asistente en dos perfiles, cerrar Admin y volver a iniciarlo para desactivar esa cuenta; todas sus sesiones deben invalidarse.
6. **Reactivación:** desde A reactivar al usuario de B. Recargar B sin ingresar credenciales: debe seguir fuera. Solo un login nuevo restaura acceso. Un Dentista/Asistente que intente reactivar mediante PATCH o PUT recibe 403; sin sesión recibe 401. Una sesión Admin cerrada/expirada recibe 401.
7. **Cambio de rol:** en A cambiar un Dentista a Asistente mientras está conectado en B. B debe ser expulsado; al iniciar nuevamente no puede abrir Comprobantes. Cambiar de vuelta a Dentista también exige login nuevo.
8. **Logout y token antiguo:** en un entorno de prueba, conservar el token de una sesión para probar la API. Cerrar esa sesión desde el frontend y llamar `/v1/auth/me` o `/v1/insumos` con el token antiguo: debe recibir 401 `SESSION_INVALID`, incluso cuando el JWT no ha vencido. Repetir conservando el token antes de desactivar y probarlo después de reactivar: también recibe 401.
9. **Permisos por API:** con la sesión de Dentista/Asistente, llamar GET `/v1/users/list`, POST `/v1/users`, PUT/DELETE `/v1/users/<id>` y PATCH `/v1/users/<id>/status`: todos reciben 403 `FORBIDDEN`. Con Asistente, probar GET/POST `/v1/comprobantes`, GET `/v1/comprobantes/<id>`, GET `/v1/comprobantes/<id>/pdf` y POST `/v1/comprobantes/<id>/enviar`: todos reciben 403. Sin autenticación, cualquier endpoint privado devuelve 401 antes de ejecutar su controlador.
10. **Recuperación y reinicio:** restablecer la contraseña de un usuario conectado en B utilizando un enlace válido: su sesión anterior debe invalidarse y el enlace no puede usarse dos veces. Reiniciar el backend conservando MongoDB: una sesión vigente debe seguir funcionando y la sesión Admin debe seguir bloqueando otro login hasta cerrar/expirar. Un token revocado no vuelve a funcionar tras el reinicio.

Para peticiones de prueba se puede usar Postman con `Authorization: Bearer <token>` o DevTools desde el frontend con `credentials: "include"`. No enviar la cookie de otro usuario junto con el Bearer: la cookie tiene prioridad. No escribir tokens en repositorios ni compartirlos.

## Archivos

Backend nuevos: `src/models/Sesion.js`, `src/services/SesionService.js`, `src/services/AdministradorService.js`, `src/middlewares/AutorizarRoles.js`, `src/middlewares/VerifyWebhook.js`.

Backend modificados: `src/models/Usuario.js`, `src/middlewares/VerifyToken.js`, `src/index.js`, `src/services/AuthService.js`, `src/services/UsuariosService.js`, `src/services/MarcaService.js`; controladores `AuthController.js`, `UsuarioController.js`, `MarcaController.js`, `DocumentoExpedienteController.js`, `Odontograma/OdontogramaController.js`, `WhatsappController.js`; rutas `AuthRoutes.js`, `UsuariosRoutes.js`, `RolesRoutes.js`, `ComprobantesRoutes.js`, `PacientesRoutes.js`, `CitasRoutes.js`, `InsumosRoutes.js`, `DocumentosExpedienteRoutes.js`, `ExpedientesRoutes.js`, `HistoriaClinicaRoutes.js`, `Odontograma/OdontogramaRoutes.js`, `WhatsappRoutes.js`.

Frontend nuevos: `src/auth/AuthContext.jsx`, `src/auth/ProtectedRoute.jsx`, `src/auth/permisos.js`, `src/services/apiClient.js`.

Frontend modificados: `src/App.jsx`, `src/main.jsx`, `src/components/Sidebar.jsx`, `src/components/VisorPDF.jsx`; páginas `Login.jsx`, `Usuarios.jsx`, `ControlMarcas.jsx`, `Home.jsx`, `Expedientes.jsx`, `Inventario/Inventario.jsx`; servicios `authService.js`, `usuarioService.js`, `citaService.js`, `marcaService.js`, `comprobanteService.js`, `insumoService.js`, `pacienteService.js`, `odontogramaService.js`, `documentoExpedienteService.js`, `reporteService.js`.

La actualización de servicios centraliza las cookies y la reacción ante respuestas de autenticación, incluidas las llamadas Axios del inventario. VisorPDF obtiene PDF/imágenes mediante esa misma carga autenticada, para que la protección del backend no impida mostrarlos. Se retiraron las credenciales de demostración expuestas en Login.

Pruebas: `ArmoniaDental-Backend/tests/usuarios.test.js`, `ArmoniaDental-Backend/tests/webhook.test.js`, `ArmoniaDental-Frontend/tests/auth.test.js`, `ArmoniaDental-Frontend/tests/authHarness.jsx`; `package.json`/`package-lock.json` del frontend añaden el comando test y `react-test-renderer` como dependencia de desarrollo.

Ejecutar `npm.cmd test` en ambas carpetas y `npm.cmd run build` en el frontend. Las pruebas usan persistencia aislada y peticiones HTTP simuladas en React; no conectan a MongoDB ni modifican cuentas existentes. Incluyen controladores reales de autenticación/CRUD, middleware de todas las rutas privadas, concurrencia del Admin, revocación y componentes reales de navegación/Sidebar. La firma del webhook se verifica mediante HTTP con cuerpos originales.
