import {
    getUserList,
    getUserInfo,
    createUser,
    modifyUser,
    deleteUsuario
} from "../services/UsuariosService.js";

export const ListUsers = async(req, res) => {

    try {

        const data = await getUserList();

        res.status(200).json(data);

    } catch(error){

        res.status(500).json({
            message:"Error obteniendo usuarios",
            error:error.message
        });

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

        res.status(500).json({
            message:"Error obteniendo usuario",
            error:error.message
        });

    }

};

export const NuevoUsuario = async(req,res)=>{

    try{

        const nuevoUsuario = await createUser(req.body);

        res.status(201).json({
            message:"Usuario creado exitosamente",
            usuario:nuevoUsuario
        });

    } catch(error){

        res.status(500).json({
            message:"Error al crear usuario",
            error:error.message
        });

    }

};

export const modificarUsuario = async(req,res)=>{

    try{

        const id = req.params.id;

        const usuarioActualizado =
            await modifyUser(id, req.body);

        res.status(200).json({

            message:"Usuario modificado exitosamente",

            usuario:usuarioActualizado

        });

    } catch(error){

        res.status(500).json({
            message:"Error al modificar usuario",
            error:error.message
        });

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

        res.status(500).json({
            message:"Error al eliminar usuario",
            error:error.message
        });

    }

};