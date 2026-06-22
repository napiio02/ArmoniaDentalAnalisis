
import { infoUser, ListUsers } from "../controllers/UsuarioController.js";
import { verifyToken } from "../middlewares/verifyToken.js";


export const UsersRoutes = (app) => {

    const version = process.env.VERSION || "vtest";

    //
    app.get(`/${version}/users/list`, ListUsers);
    app.get(`/${version}/users/info/:id`, infoUser);

}