import {
    getUserList,
    getUserInfo,
    createUser,
    modifyUser,
    deleteUsuario
} from "../services/UsuariosService.js";

const responderError = (res, error, mensaje) => {
    const status = error.code === 11000 ? 409
        : error.statusCode || (["ValidationError", "CastError"].includes(error.name) ? 400 : 500);
    const detalle = error.code === 11000
        ? "Ya existe un usuario con ese correo o cédula." : error.message;
    return res.status(status).json({ message: detalle || mensaje, error: detalle });
};

export const cambiarEstadoUsuario = async (req, res) => {
    try {
        if (typeof req.body?.activo !== "boolean") {
            return res.status(400).json({ message: "Debe indicar el estado activo del usuario." });
        }
        const usuario = await modifyUser(req.params.id, { activo: req.body.activo });
        return res.status(200).json({
            message: `Usuario ${usuario.activo ? "activado" : "desactivado"} exitosamente`,
            usuario,
        });
    } catch (error) {
        return responderError(res, error, "Error al cambiar el estado del usuario");
    }
};

export const ListUsers = async(req, res) => {

    try {

        const data = await getUserList();

        res.status(200).json(data);

    } catch(error){

        responderError(res, error, "Error obteniendo usuarios");

    }

};

export const infoUser = async(req, res) => {

    try {

        const user_id = req.params.id;

        const data = await getUserInfo(user_id);

        if(!data){
            return res.status(404).json({
                message:"Usuario no encontrado"
            });
        }

        res.status(200).json(data);

    } catch(error){

        responderError(res, error, "Error obteniendo usuario");

    }

};

export const NuevoUsuario = async(req,res)=>{

    try{

        const nuevoUsuario = await createUser(req.body || {});

        res.status(201).json({
            message:"Usuario creado exitosamente",
            usuario:nuevoUsuario
        });

    } catch(error){

        responderError(res, error, "Error al crear usuario");

    }

};

export const modificarUsuario = async(req,res)=>{

    try{

        const id = req.params.id;

        const usuarioActualizado =
            await modifyUser(id, req.body || {});

        res.status(200).json({

            message:"Usuario modificado exitosamente",

            usuario:usuarioActualizado

        });

    } catch(error){

        responderError(res, error, "Error al modificar usuario");

    }

};

export const borrarUsuario = async(req,res)=>{

    try{

        const idUsuario = req.params.id;

        await deleteUsuario(idUsuario);

        res.status(200).json({

            message:"Usuario eliminado exitosamente",

            usuario:idUsuario

        });

    } catch(error){

        responderError(res, error, "Error al eliminar usuario");

    }

};