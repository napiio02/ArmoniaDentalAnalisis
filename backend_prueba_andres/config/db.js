import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectDB() {
	try {
		if (!process.env.MONGO_URI) {
			throw new Error("No se encontró MONGO_URI en el archivo .env");
		}

		const conn = await mongoose.connect(process.env.MONGO_URI, {
			serverSelectionTimeoutMS: 15000,
			family: 4,
		});

		console.log(`MongoDB Atlas conectado: ${conn.connection.host}`);
	} catch (error) {
		console.error("Error al conectar con MongoDB Atlas:", error.message);
		process.exit(1);
	}
}