import TaskService from "../services/task-service";
import {ITask, ITaskStatus} from "../models/models";
import {JwtPayload} from "jsonwebtoken";

class TaskController {
    //Создание задачи
    async createTask(data: Omit<ITask, 'task_id' | 'status'>, callback: Function) {
        try {
            const {
                name, description, priority, complation_date, project_id, member
            } = data;
            const taskData = await TaskService.createTask(name, description, priority,
                complation_date, project_id, member);
            callback(taskData)
        } catch (e) {
            throw e;
        }
    }

    //Обновление задачи
    async updateTask(data: ITask, callback: Function, userData: JwtPayload) {
        try {
            const {task_id, name, description, priority,
                complation_date, project_id, member, status} = data;
            const taskData = await TaskService.updateTask(task_id, name, description, priority,
                complation_date, project_id, member, status, userData);
            callback(taskData);
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
    async updateStatusTask(data: ITaskStatus, callback: Function) {
        try {
            const task: ITaskStatus = await TaskService.updateStatusTask(data);
            callback(task)
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
}

export default new TaskController();