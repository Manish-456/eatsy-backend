import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary'

import Database from "./config/database";
import userRoute from './routes/user.route';
import restaurantRoute from "./routes/restaurant.route";
import myRestaurantRoute from './routes/myRestaurant.route';
import orderRoute from './routes/order.route';

const app = express();
const PORT = process.env.PORT || 8080

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
app.use("/api/restaurant", restaurantRoute)
app.use("/api/my/restaurant", myRestaurantRoute);
app.use("/api/order", orderRoute);

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