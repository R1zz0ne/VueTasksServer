import userController from "../controllers/user-controller";
import authMiddleware from "../middlewares/auth-middleware";
import projectController from "../controllers/project-controller";
import taskController from "../controllers/task-controller";
import {Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import PGInterface from "../ORM/PGInterface";
import {JwtPayload} from "jsonwebtoken";
import notificationController from "../controllers/notification-controller";
import OtherService from "../services/other-service";

type TControllerFunction = (data: any, socket: Socket<DefaultEventsMap>, eventName: string, userData: any) => Promise<any>;
type TControllerCallbackFunction = (data: any, callback: Function, userData: any) => Promise<any>;

const socketControllerWrapper = (
    controller: TControllerFunction,
    middleware: Function | null = null
) => async (data: any, socket: Socket, eventName: string) => {
    try {
        let userData: any = {}
        if (middleware) {
            const accessToken = socket.handshake.auth.accessToken;
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
            const accessToken = socket.handshake.auth.accessToken;
            userData = await middleware(data, accessToken)
        }
        await controller(data, callback, userData)
    } catch (e: any) {
        callback({type: 'error', message: e.message});
    }
}

const socketRouter = (socket: Socket) => {
    console.log(`Пользователь ${socket.id} подключен`)
    if (socket.handshake.auth.accessToken !== 'null') {
        try {
            const userData: string | JwtPayload = authMiddleware(null, socket.handshake.auth.accessToken);
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
    handleEvent('createProject', projectController.createProject, authMiddleware)
    handleEvent('updateProject', projectController.updateProject, authMiddleware)
    handleEvent('getProjectList', projectController.getProjectList, authMiddleware)
    socket.on('getProject', (data, callback) =>
        socketControllerCallbackWrapper(projectController.getProject, authMiddleware)(data, callback, socket))
    handleEvent('updateProjectEditor', projectController.updateEditor, authMiddleware)

    //taskController
    handleEvent('createTask', taskController.createTask, authMiddleware)
    handleEvent('updateTask', taskController.updateTask, authMiddleware)
    socket.on('getTask', (data, callback) =>
        socketControllerCallbackWrapper(taskController.getInfoForTask, authMiddleware)(data, callback, socket))
    handleEvent('updateStatusTask', taskController.updateStatusTask, authMiddleware)
    handleEvent('getTaskList', taskController.getUserTasks, authMiddleware)
    handleEvent('getCloseTaskList', taskController.getCloseUserTasks, authMiddleware)
    handleEvent('updateTaskEditor', taskController.updateEditor, authMiddleware)

    //notificationController
    handleEvent('getNotification', notificationController.getNotificationLog, authMiddleware)
    socket.on('checkNotification', (data, callback) =>
        socketControllerCallbackWrapper(notificationController.checkNotification, authMiddleware)(data, callback, socket));

    //Room
    socket.on('joinRoom', async (data) => {
        if (data.id) {
            const room = `${data.type}_${data.id}`
            socket.join(room);
            const users = await OtherService.getUserNameForSocketId(room);
            await OtherService.emitToRoom(room, `${data.type}_room`, users)
        } else {
            socket.join(data.type)
        }

    })
    socket.on('leaveRoom', async (data) => {
        if (data.id) {
            const room = `${data.type}_${data.id}`
            socket.leave(room);
            const users = await OtherService.getUserNameForSocketId(room);
            await OtherService.emitToRoom(room, `${data.type}_room`, users)
            await OtherService.cleanEditor(data.type, data.id, socket.id)
        } else {
            socket.leave(data.type)
        }

    })

    //disconnect
    socket.on('disconnecting', () => {
        const rooms = Array.from(socket.rooms)
        rooms.forEach(async (room) => await OtherService.disconnecting(room, socket))
    })
    socket.on('disconnect', async () => {
        console.log(`${socket.id} disconnected`);
        await PGInterface.update({
            table: 'users',
            set: [`socket_id=''`],
            condition: `socket_id='${socket.id}'`
        })
    });
}

export default socketRouter;