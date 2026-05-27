import mongoose from "mongoose";

const UsersSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password_hash: {
        type: String,
        required: false
    },

    cedula: {
        type: String,
        required: true,
        unique: true
    },

    telefono: {
        type: String,
        required: true
    },

    activo: {
        type: Boolean,
        default: true
    },

    rol_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Roles",
        required: true
    }

},
{
    collection: "usuarios",
    timestamps: true
});

const Users = mongoose.model("Users", UsersSchema);

export default Users;