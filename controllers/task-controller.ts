import TaskService from "../services/task-service";
import {ITask, ITaskStatusIn, ITaskStatusOut} from "../models/models";
import {JwtPayload} from "jsonwebtoken";
import {Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {io} from "../index";
import OtherService from "../services/other-service";

class TaskController {
    //Создание задачи
    async createTask(data: Omit<ITask, 'taskId' | 'status'>, Socket: Socket<DefaultEventsMap>, eventName: string) {
        try {
            const {
                name, description, priority, completionDate, projectId, member
            } = data;
            const taskData = await TaskService.createTask(name, description, priority,
                completionDate, projectId, member);
            io.to(`project_${taskData.project.projectId}`).emit(eventName, taskData)
            //Дальше для обновления списка задач у пользователя
            const socketId = await OtherService.getSocketIdForUserId(taskData.member.userId)
            const taskListRoom = io.sockets.adapter.rooms.get(`taskList`)
            if (taskListRoom && socketId) {
                const userInRoom: boolean = Array.from(taskListRoom).includes(socketId)
                if (userInRoom) {
                    io.to(socketId).emit('addNewTaskInList', {
                        taskId: taskData.taskId,
                        name: taskData.name,
                        priority: taskData.priority,
                        status: taskData.status
                    })
                }
            }
        } catch (e) {
            throw e;
        }
    }

    //Обновление задачи
    async updateTask(data: ITask, socket: Socket<DefaultEventsMap>, eventName: string, userData: JwtPayload) {
        try {
            const {
                taskId, name, description, priority,
                completionDate, projectId, member, status
            } = data;
            const taskData = await TaskService.updateTask(taskId, name, description, priority,
                completionDate, projectId, member, status, userData);
            io.to(`task_${taskData.taskId}`).emit(eventName, taskData);
            io.to(`taskList`).emit(eventName, taskData);
            io.to(`project_${taskData.project.projectId}`).emit(eventName, taskData);
            io.to(`board_${taskData.project.projectId}`).emit(eventName, taskData);
        } catch (e) {
            throw e;
        }
    }

    //Получение списка моих задач
    async getUserTasks(data: any, socket: Socket<DefaultEventsMap>, eventName: string, userData: JwtPayload) {
        try {
            const totalCount = await OtherService.getTotalRecord('tasks',
                `member=${userData.userId} AND status!='completed'`);
            socket.emit('taskTotalCount', {totalCount: Number(totalCount)});
            const taskData = await TaskService.getUserTasks(userData.userId, data.page, "status!='completed'");
            socket.emit(eventName, taskData)
        } catch (e) {
            throw e;
        }
    }

    //Получение информации по задаче
    async getInfoForTask(data: { taskId: number }, callback: Function) {
        try {
            const task = await TaskService.getInfoForTask(data.taskId);
            callback(task)
        } catch (e) {
            throw e;
        }
    }

    //Обновить статус задачи
    async updateStatusTask(data: ITaskStatusIn, socket: Socket, eventName: string) {
        try {
            const task: ITaskStatusOut = await TaskService.updateStatusTask(data);
            io.to(`board_${task.projectId}`).emit(eventName, task)
            io.to(`project_${task.projectId}`).emit(eventName, task)
            io.to(`task_${task.taskId}`).emit(eventName, task)
            io.to(`taskList`).emit(eventName, task)
        } catch (e) {
            throw e;
        }
    }

    //Получение списка моих завершенных задач
    async getCloseUserTasks(data: any, socket: Socket<DefaultEventsMap>, eventName: string, userData: JwtPayload) {
        try {
            const totalCount = await OtherService.getTotalRecord('tasks',
                `member=${userData.userId} AND status='completed'`)
            socket.emit('taskTotalCount', {totalCount: Number(totalCount)});
            const taskData = await TaskService.getUserTasks(userData.userId, data.page, "status='completed'");
            socket.emit(eventName, taskData)
        } catch (e) {
            throw e;
        }
    }

    //Установка редактора задачи
    async updateEditor(data: Pick<ITask, 'taskId' | 'editor'>, socket: Socket<DefaultEventsMap>, eventName: string) {
        try {
            const editorData = await TaskService.updateEditor(data)
            io.to(`task_${editorData.taskId}`).emit(eventName, editorData)
        } catch (e) {
            throw e;
        }
    }
}

export default new TaskController();