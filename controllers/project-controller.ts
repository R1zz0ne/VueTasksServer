import ProjectService from "../services/project-service";
import {ICreateProjectData, IUpdateProjectData} from "../models/models";

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

    async updateProject(data: IUpdateProjectData, callback: Function) {
        try {
            const {project_id, name, description, owner} = data;
            const projectData = await ProjectService.updateProject(project_id, name, description, owner)
            callback(projectData);
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
}

export default new ProjectController();