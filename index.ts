import express, {Express} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./router/router";
import errorMiddleware from "./middlewares/error-middleware";

const PORT: number = 5000;
const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173'
}));
app.use('/api/', router)
app.use(errorMiddleware);

const start = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Сервер запущен на ${PORT} порту.`)
        })
    } catch (e: any) {
        console.log(e)
    }
}

start();