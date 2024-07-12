import {NextFunction, Request, Response} from "express";
import ProjectService from "../services/project-service";

class ProjectController {
    async createProject(req: Request, res: Response, next: NextFunction) {
        try {
            const {name, description, owner} = req.body;
            const projectData = await ProjectService.createProject(name, description, owner);
            return res.json(projectData);
        } catch (e) {
            next(e);
        }
    }

    async updateProject(req: Request, res: Response, next: NextFunction) {
        try {
            const {id, name, description, owner} = req.body;
            const projectData = await ProjectService.updateProject(id, name, description, owner)
            return res.json(projectData)
        } catch (e) {
            next(e)
        }
    }

    async getProjectList(req: Request, res: Response, next: NextFunction) {
        try {
            const projectList = await ProjectService.getProjectList();
            return res.json(projectList)
        } catch (e) {
            next(e);
        }
    }

    async getProject(req: Request, res: Response, next: NextFunction) {
        try {
            const project = await ProjectService.getProject(Number(req.query.id));
            return res.json(project)
        } catch (e) {
            next(e)
        }
    }
}

export default new ProjectController();