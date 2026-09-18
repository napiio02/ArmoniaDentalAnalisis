import { autorizarRoles } from "../middlewares/AutorizarRoles.js";
import { verifyToken } from "../middlewares/VerifyToken.js";
import { ListRol } from "../controllers/RolController.js";

export const RolesRoutes = (app) => {

    const version = process.env.VERSION || "v1";

    app.get(`/${version}/roles/list`, verifyToken, autorizarRoles("Admin"), ListRol);

}