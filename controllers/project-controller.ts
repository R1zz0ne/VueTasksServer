import ProjectService from "../services/project-service";
import {ICreateProjectData, IProject, IUpdateProjectData} from "../models/models";
import {Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {JwtPayload} from "jsonwebtoken";
import {io} from "../index";
import OtherService from "../services/other-service";

class ProjectController {
    async createProject(data: ICreateProjectData, socket: Socket<DefaultEventsMap>, eventName: string, userData: JwtPayload) {
        try {
            const {name, description, owner} = data;
            const projectData = await ProjectService.createProject(name, description, owner);
            socket.emit(eventName, projectData);
            io.to('projectList').emit('addNewProjectInList', {
                project_id: projectData.project_id,
                name: projectData.name
            });
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

    async getProjectList(data: { page: number }, socket: Socket<DefaultEventsMap>,
                         eventName: string, userData: JwtPayload) {
        try {
            const totalCount = await OtherService.getTotalRecord('projects');
            socket.emit('projectTotalCount', {totalCount: Number(totalCount)});
            const projectList = await ProjectService.getProjectList(data);
            socket.emit(eventName, projectList)
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