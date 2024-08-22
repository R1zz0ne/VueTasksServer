import ProjectService from "../services/project-service";
import {ICreateProjectData, IProject, IUpdateProjectData} from "../models/models";
import {Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {JwtPayload} from "jsonwebtoken";
import {io} from "../index";

class ProjectController {
    async createProject(data: ICreateProjectData, callback: Function) {
        try {
            const {name, description, owner} = data;
            const projectData = await ProjectService.createProject(name, description, owner);
            callback(projectData)
        } catch (e: any) {
            throw e;
        }
    }

    async updateProject(data: IUpdateProjectData, socket: Socket<DefaultEventsMap>, eventName: string, userData: JwtPayload) {
        try {
            const {project_id, name, description, owner} = data;
            const projectData = await ProjectService.updateProject(project_id, name, description, owner)
            io.to(`project_${projectData.project_id}`).emit(eventName, projectData)
            io.to(`projectList`).emit(eventName, projectData)
        } catch (e) {
            throw e;
        }
    }

    async getProjectList(data: null, callback: Function) {
        try {
            const projectList = await ProjectService.getProjectList();
            callback(projectList)
        } catch (e: any) {
            throw e;
        }
    }

    async getProject(data: { projectId: number }, callback: Function) {
        try {
            const project = await ProjectService.getProject(data.projectId);
            callback(project)
        } catch (e) {
            throw e;
        }
    }

    async updateEditor(data: Pick<IProject, 'project_id' | 'editor'>, socket: Socket<DefaultEventsMap>, eventName: string) {
        try {
            const editorData = await ProjectService.updateEditor(data);
            io.to(`project_${editorData.project_id}`).emit(eventName, editorData)
        } catch (e) {
            throw e;
        }
    }
}

export default new ProjectController();