import express, {Express} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./router/router";
import errorMiddleware from "./middlewares/error-middleware";
import './cronJobs/cronJobs';
import 'dotenv/config';

const PORT: number = Number(process.env.PORT) || 5000;
const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT
}));
app.use('/api/', router);
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