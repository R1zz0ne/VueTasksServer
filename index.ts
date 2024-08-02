import express from "express";
import http from 'http';
import {Server} from 'socket.io';
import './cronJobs/cronJobs';
import 'dotenv/config';
import socketRouter from "./router/router";

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {cors: {origin: '*'}})

const PORT: number = Number(process.env.PORT) || 5000;

io.on('connection', socketRouter)

httpServer.listen(PORT, () => {
    console.log(`Сервер запущен на ${PORT} порту.`)
})