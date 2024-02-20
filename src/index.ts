import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import Database from "./config/database";

const app = express();
const PORT = process.env.PORT || 8080

const db = new Database(process.env.DATABASE_URL!)

db.connect().catch(err => console.error("Failed to connect to the database"))

app.use(express.json());
app.use(cors());

app.get("/test", (req: Request, res: Response) => {
    return res.json({
        message: "Hello!"
    })
})

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