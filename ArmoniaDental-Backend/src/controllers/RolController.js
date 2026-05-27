import { getRoles } from "../services/RolesServices.js";

export const ListRol = async(req,res)=>{

    try{

        const data = await getRoles();

        res.status(200).json(data);

    } catch(error){

        res.status(500).json({

            message:"Error obteniendo roles",

            error:error.message

        });

    }

};