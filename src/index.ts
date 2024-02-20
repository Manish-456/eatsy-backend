import "dotenv/config";
import express, { Request, Response} from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080

app.use(express.json());
app.use(cors());

app.get("/test", (req: Request, res: Response) => {
    return res.json({
        message: "Hello!"
    })
})

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`))