import mongoose from "mongoose";

const RolesSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true,
        maxlength: 30,
        trim: true
    },

    descripcion: {
        type: String,
        required: true,
        trim: true
    },

    activo: {
        type: Boolean,
        default: true,
        required: true
    }

},
{
    collection: "roles",
    timestamps: false
});

const Roles = mongoose.model("Roles", RolesSchema);

export default Roles;