import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";

import Database from "./config/database";
import userRoute from './routes/user.route';
const app = express();
const PORT = process.env.PORT || 8080

const db = new Database(process.env.DATABASE_URL!)

db.connect().catch(err => console.error("Failed to connect to the database"))

app.use(express.json());
app.use(cors());

app.get("/health", (req: Request, res: Response) => {
    return res.json({
        message: "Server is up and running ✅🔥"
    })
})

app.use("/api/user", userRoute);

process.on("SIGINT", async () => {
    try {
        await db.disconnect()
        process.exit(0);
    } catch (error) {
        console.error('Failed to disconnect from the database');
        process.exit(1);
    }
})


app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`))