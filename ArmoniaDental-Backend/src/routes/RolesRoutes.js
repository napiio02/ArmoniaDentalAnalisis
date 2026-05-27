import { ListRol } from "../controllers/RolController.js";

export const RolesRoutes = (app) => {

    const version = process.env.VERSION || "vtest";

    app.get(`/${version}/roles/list`, ListRol);

}