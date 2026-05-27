import Roles from "../models/Roles.js";

export const getRoles = async() => {

    const roles = await Roles.find({

        nombre: {
            $ne: "Administrator"
        }

    });

    return roles;

};