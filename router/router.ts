import userController from "../controllers/user-controller";
import authMiddleware from "../middlewares/auth-middleware";
import projectController from "../controllers/project-controller";
import taskController from "../controllers/task-controller";
import {Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import PGInterface from "../ORM/PGInterface";
import {JwtPayload} from "jsonwebtoken";
import notificationController from "../controllers/notification-controller";

type TControllerFunction = (data: any, socket: Socket<DefaultEventsMap>, eventName: string, userData: any) => Promise<any>;
type TControllerCallbackFunction = (data: any, callback: Function, userData: any) => Promise<any>;

const socketControllerWrapper = (
    controller: TControllerFunction,
    middleware: Function | null = null
) => async (data: any, socket: Socket, eventName: string) => {
    try {
        let userData: any = {}
        if (middleware) {
            const accessToken = socket.handshake.headers.accesstoken;
            userData = await middleware(data, accessToken)
        }
        await controller(data, socket, eventName, userData)
    } catch (e: any) {
        socket.emit('error', {type: 'error', message: e.message});
    }
}

const socketControllerCallbackWrapper = (
    controller: TControllerCallbackFunction,
    middleware: Function | null = null
) => async (data: any, callback: Function, socket: Socket<DefaultEventsMap>) => {
    try {
        let userData: any = {}
        if (middleware) {
            const accessToken = socket.handshake.headers.accesstoken;
            userData = await middleware(data, accessToken)
        }
        await controller(data, callback, userData)
    } catch (e: any) {
        callback({type: 'error', message: e.message});
    }
}

const socketRouter = (socket: Socket) => {
    console.log(`Пользователь ${socket.id} подключен`)
    if (socket.handshake.headers.accesstoken !== 'null') {
        try {
            const userData: string | JwtPayload = authMiddleware(null, socket.handshake.headers.accesstoken);
            if (typeof userData !== 'string') {
                PGInterface.update({
                    table: 'users',
                    condition: `user_id=${userData.user_id}`,
                    set: [`socket_id='${socket.id}'`],
                })
            }
        } catch (e) {
            console.log(`Токен истек. Подробности: ${e}`)
        }
    }

    const handleEvent = (eventName: string, controller: TControllerFunction, middleware: Function | null = null) => {
        socket.on(eventName, (data: any) => {
            socketControllerWrapper(controller, middleware)(data, socket, eventName);
        });
    };
    //handleEvent('login', userController.login)

    //userController
    socket.on('login', (data, callback) =>
        socketControllerCallbackWrapper(userController.login)(data, callback, socket))
    socket.on('registration', (data, callback) =>
        socketControllerCallbackWrapper(userController.registration)(data, callback, socket))
    socket.on('logout', (data, callback) =>
        socketControllerCallbackWrapper(userController.logout)(data, callback, socket))
    socket.on('refresh', (data, callback) =>
        socketControllerCallbackWrapper(userController.refresh)(data, callback, socket))
    socket.on('getUsers', (data, callback) =>
        socketControllerCallbackWrapper(userController.getUsers, authMiddleware)(data, callback, socket))

    //projectController
    socket.on('createProject', (data, callback) =>
        socketControllerCallbackWrapper(projectController.createProject, authMiddleware)(data, callback, socket))
    socket.on('updateProject', (data, callback) =>
        socketControllerCallbackWrapper(projectController.updateProject, authMiddleware)(data, callback, socket))
    socket.on('getProjectList', (data, callback) =>
        socketControllerCallbackWrapper(projectController.getProjectList, authMiddleware)(data, callback, socket))
    socket.on('getProject', (data, callback) =>
        socketControllerCallbackWrapper(projectController.getProject, authMiddleware)(data, callback, socket))

    //taskController
    socket.on('createTask', (data, callback) =>
        socketControllerCallbackWrapper(taskController.createTask, authMiddleware)(data, callback, socket))
    socket.on('updateTask', (data, callback) =>
        socketControllerCallbackWrapper(taskController.updateTask, authMiddleware)(data, callback, socket))
    socket.on('getTask', (data, callback) =>
        socketControllerCallbackWrapper(taskController.getInfoForTask, authMiddleware)(data, callback, socket))
    socket.on('updateStatusTask', (data, callback) =>
        socketControllerCallbackWrapper(taskController.updateStatusTask, authMiddleware)(data, callback, socket))
    socket.on('getTaskList', (data, callback) =>
        socketControllerCallbackWrapper(taskController.getUserTasks, authMiddleware)(data, callback, socket))
    socket.on('getCloseTaskList', (data, callback) =>
        socketControllerCallbackWrapper(taskController.getCloseUserTasks, authMiddleware)(data, callback, socket))

    //notificationController
    handleEvent('getNotification', notificationController.getNotificationLog, authMiddleware)

    socket.on('disconnect', async () => {
        console.log('Client disconnected');
        await PGInterface.update({
            table: 'users',
            set: [`socket_id=''`],
            condition: `socket_id='${socket.id}'`
        })
    });
}

export default socketRouter;