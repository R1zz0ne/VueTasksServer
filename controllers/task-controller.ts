import {NextFunction, Request, Response} from "express"
import TaskService from "../services/task-service";
import {ITaskStatus} from "../models/models";
import tokenService from "../services/token-service";
import apiError from "../exceptions/api-error";

class TaskController {
    //Создание задачи
    async createTask(req: Request, res: Response, next: NextFunction) {
        try {
            const {name, description, priority, complation_date, project_id, member} = req.body;
            const taskData = await TaskService.createTask(name, description, priority,
                complation_date, project_id, member);
            return res.json(taskData)
        } catch (e) {
            next(e)
        }
    }

    //Обновление задачи
    async updateTask(req: Request, res: Response, next: NextFunction) {
        try {
            const {task_id, name, description, priority, complation_date, project_id, member, status} = req.body;
            const taskData = await TaskService.updateTask(task_id, name, description, priority,
                complation_date, project_id, member, status);
            return res.json(taskData);
        } catch (e) {
            next(e)
        }
    }

    //Получение списка моих задач
    async getUserTasks(req: Request, res: Response, next: NextFunction) {
        try {
            const userData = tokenService.getUserDataInAuthData(req.headers.authorization)
            if (typeof userData === 'string') {
                throw (apiError.UnauthorizedError())
            }
            const taskData = await TaskService.getUserTasks(userData.user_id, "status!='complited'");
            return res.json(taskData);
        } catch (e) {
            next(e)
        }
    }

    //Получение информации по задаче
    async getInfoForTask(req: Request, res: Response, next: NextFunction) {
        try {
            const taskId: number = Number(req.query.id);
            const task = await TaskService.getInfoForTask(taskId);
            return res.json(task);
        } catch (e) {
            next(e)
        }
    }

    //Обновить статус задачи
    async updateStatusTask(req: Request, res: Response, next: NextFunction) {
        try {
            const taskObj: ITaskStatus = req.body;
            const task: ITaskStatus = await TaskService.updateStatusTask(taskObj);
            return res.json(task);
        } catch (e) {
            next(e)
        }
    }

    //Получение списка моих завершенных задач
    async getCloseUserTasks(req: Request, res: Response, next: NextFunction) {
        try {
            const userData = tokenService.getUserDataInAuthData(req.headers.authorization)
            if (typeof userData === 'string') {
                throw (apiError.UnauthorizedError())
            }
            const taskData = await TaskService.getUserTasks(userData.user_id, "status='complited'");
            return res.json(taskData);
        } catch (e) {
            next(e)
        }
    }
}

export default new TaskController();