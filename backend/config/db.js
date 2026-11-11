import mongoose from "mongoose";

export const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("MONGO_URI is missing. Copy .env.example to .env and fill it in.");
        process.exit(1);
    }
    await mongoose.connect(uri);
    console.log("DB connected");
}
