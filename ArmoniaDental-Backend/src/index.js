import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./database/DatabaseConnection.js";
import mongoose from "mongoose";

import { UsersRoutes } from "./routes/UsersRoutes.js";
import { RolesRoutes } from "./routes/RolesRoutes.js";
import { InsumosRoutes } from "./routes/InsumosRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

UsersRoutes(app);
RolesRoutes(app);
InsumosRoutes(app);

app.listen(port, async () => {

  try {

    //* Conectar Mongo Atlas
    await connectDB();

    console.log(`Server started on port ${port}`);

  } catch(error) {

    console.error(error);

  }

});

export default app;