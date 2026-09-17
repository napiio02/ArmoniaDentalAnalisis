import {
  infoUser, ListUsers, NuevoUsuario, modificarUsuario,
  cambiarEstadoUsuario, borrarUsuario,
} from "../controllers/UsuarioController.js";
import { verifyToken } from "../middlewares/VerifyToken.js";

export const UsersRoutes = (app) => {
  const version = process.env.VERSION || "v1";

  app.get(`/${version}/users/list`, verifyToken, ListUsers);
  app.get(`/${version}/users/info/:id`, verifyToken, infoUser);
  app.post(`/${version}/users`, verifyToken, NuevoUsuario);
  app.put(`/${version}/users/:id`, verifyToken, modificarUsuario);
  app.patch(`/${version}/users/:id/status`, verifyToken, cambiarEstadoUsuario);
  app.delete(`/${version}/users/:id`, verifyToken, borrarUsuario);
};
