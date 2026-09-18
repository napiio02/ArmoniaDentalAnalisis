import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import {
  listarPersonal, infoUser, ListUsers, NuevoUsuario, modificarUsuario,
  cambiarEstadoUsuario, borrarUsuario,
} from "../controllers/UsuarioController.js";
import { verifyToken } from "../middlewares/VerifyToken.js";

export const UsersRoutes = (app) => {
  const version = process.env.VERSION || "v1";
  app.get(`/${version}/personal`, verifyToken, listarPersonal);

  app.get(`/${version}/users/list`, verifyToken, autorizarRoles("Admin"), ListUsers);
  app.get(`/${version}/users/info/:id`, verifyToken, autorizarRoles("Admin"), infoUser);
  app.post(`/${version}/users`, verifyToken, autorizarRoles("Admin"), NuevoUsuario);
  app.put(`/${version}/users/:id`, verifyToken, autorizarRoles("Admin"), modificarUsuario);
  app.patch(`/${version}/users/:id/status`, verifyToken, autorizarRoles("Admin"), cambiarEstadoUsuario);
  app.delete(`/${version}/users/:id`, verifyToken, autorizarRoles("Admin"), borrarUsuario);
};
