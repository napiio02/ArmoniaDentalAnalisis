import Users from "../models/Users.js";
// import bcrypt from "bcrypt";

export const getUserList = async() => {

    const users = await Users.find();

    return users;
};

export const getUserInfo = async(id) => {

    const user = await Users.find().populate("rol_id")

    return user;
};

export const createUser = async(data) => {

    const {
        nombre,
        email,
        password,
        cedula,
        telefono,
        rol_id,
        activo
    } = data;

    let hashedPassword = null;

    // if(password){

    //     hashedPassword =
    //         await bcrypt.hash(password,10);

    // }

    const user = await Users.create({

        nombre,
        email,
        password_hash: hashedPassword,
        cedula,
        telefono,
        rol_id,
        activo

    });

    return user;
};

export const modifyUser = async(id,data)=>{

    const {
        nombre,
        email,
        password,
        cedula,
        telefono,
        rol_id,
        activo
    } = data;

    const updateData = {

        nombre,
        email,
        cedula,
        telefono,
        rol_id,
        activo

    };

    // if(password){

    //     updateData.password_hash =
    //         await bcrypt.hash(password,10);

    // }

    const updatedUser =
        await Users.findByIdAndUpdate(

            id,

            updateData,

            { new:true }

        );

    return updatedUser;
};

export const deleteUsuario = async(id)=>{

    return await Users.findByIdAndDelete(id);

};