import TaskService from "../services/task-service";
import {ITask, ITaskStatusIn, ITaskStatusOut} from "../models/models";
import {JwtPayload} from "jsonwebtoken";
import {Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {io} from "../index";
import OtherService from "../services/other-service";

class TaskController {
    //Создание задачи
    async createTask(data: Omit<ITask, 'task_id' | 'status'>, Socket: Socket<DefaultEventsMap>, eventName: string) {
        try {
            const {
                name, description, priority, complation_date, project_id, member
            } = data;
            const taskData = await TaskService.createTask(name, description, priority,
                complation_date, project_id, member);
            io.to(`project_${taskData.project.project_id}`).emit(eventName, taskData)
            //Дальше для обновления списка задач у пользователя
            const socket_id = await OtherService.getSocketIdForUserId(taskData.member.user_id)
            const taskListRoom = io.sockets.adapter.rooms.get(`taskList`)
            if (taskListRoom) {
                const userInRoom: boolean = Array.from(taskListRoom).includes(socket_id)
                if (userInRoom) {
                    //TODO: Емит не сделан, т.к. не понятно как с пагинацией правильно будет сделать
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
                task_id, name, description, priority,
                complation_date, project_id, member, status
            } = data;
            const taskData = await TaskService.updateTask(task_id, name, description, priority,
                complation_date, project_id, member, status, userData);
            io.to(`task_${taskData.task_id}`).emit(eventName, taskData);
            io.to(`taskList`).emit(eventName, taskData);
            io.to(`project_${taskData.project.project_id}`).emit(eventName, taskData);
            io.to(`board_${taskData.project.project_id}`).emit(eventName, taskData);
        } catch (e) {
            throw e;
        }
    }

    //Получение списка моих задач
    async getUserTasks(data: any, callback: Function, userData: JwtPayload) {
        try {
            const taskData = await TaskService.getUserTasks(userData.user_id, "status!='completed'");
            callback(taskData)
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
            io.to(`board_${task.project_id}`).emit(eventName, task)
            io.to(`project_${task.project_id}`).emit(eventName, task)
            io.to(`task_${task.task_id}`).emit(eventName, task)
            io.to(`taskList`).emit(eventName, task)
        } catch (e) {
            throw e;
        }
    }

    //Получение списка моих завершенных задач
    async getCloseUserTasks(data: any, callback: Function, userData: JwtPayload) {
        try {
            const taskData = await TaskService.getUserTasks(userData.user_id, "status='completed'");
            callback(taskData)
        } catch (e) {
            throw e;
        }
    }

    //Установка редактора задачи
    async updateEditor(data: Pick<ITask, 'task_id' | 'editor'>, socket: Socket<DefaultEventsMap>, eventName: string) {
        try {
            const editorData = await TaskService.updateEditor(data)
            io.to(`task_${editorData.task_id}`).emit(eventName, editorData)
        } catch (e) {
            throw e;
        }
    }
}

export default new TaskController();