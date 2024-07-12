import PGInterface from "../ORM/PGInterface";
import {IOwner, IProject, IProjectWithOwner, ITasksWithMember} from "../models/models";

class ProjectService {
    async createProject(name: string, description: string, ownerId: number) {
        const projectArr = await PGInterface.insert({
            table: 'projects',
            fields: ['name', 'description', 'owner'],
            values: [`'${name}'`, `'${description}'`, `${ownerId}`],
            returns: ['project_id', 'name', 'description', 'owner']
        })
        const project: IProject = projectArr[0];
        const ownerInfo: IOwner[] = await PGInterface.select({
            table: 'users',
            fields: ['user_id', 'name', 'email'],
            condition: `user_id=${project.owner}`
        })
        return {
            project_id: project.project_id,
            name: project.name,
            description: project.description,
            owner: ownerInfo[0],
            tasks: []
        }
    }

    async updateProject(id: number, name: string, description: string, ownerId: number) {
        const projectArr = await PGInterface.update({
            table: 'projects',
            set: [`name='${name}'`, `description='${description}'`, `owner=${ownerId}`],
            condition: `project_id=${id}`,
            returns: ['*']
        })
        const project: IProject = projectArr[0];
        const ownerInfo: IOwner[] = await PGInterface.select({
            table: 'users',
            fields: ['user_id', 'name', 'email'],
            condition: `user_id=${project.owner}`
        })
        return {
            project_id: project.project_id,
            name: project.name,
            description: project.description,
            owner: ownerInfo[0]
        }
    }

    async getProjectList() {
        const projects: IProjectWithOwner[] = await PGInterface.select({
            table: 'projects',
            fields: ['project_id', 'name'],
            order: 'project_id'
        })
        return projects;
    }

    async getProject(id: number) {
        const projects: IProjectWithOwner[] = await PGInterface.select({
            table: 'projects',
            fields: ['projects.project_id', 'projects.name', 'projects.description',
                'users.user_id AS ownid', 'users.name AS ownname', 'users.email AS ownemail'],
            join: [{
                type: 'INNER JOIN',
                table: 'users',
                firstId: 'users.user_id',
                secondId: 'projects.owner'
            }],
            condition: `projects.project_id=${id}`
        })
        const tasks: ITasksWithMember[] = await PGInterface.select({
            table: 'tasks',
            fields: ['tasks.task_id', 'tasks.name', 'tasks.priority', 'tasks.complation_date',
                'tasks.status', 'users.user_id AS memid', 'users.name AS memname', 'users.email AS mememail'],
            join: [{
                type: 'INNER JOIN',
                table: 'users',
                firstId: 'users.user_id',
                secondId: 'tasks.member'
            }],
            condition: `tasks.project_id=${id}`
        })
        const mapTasks = tasks.map((task) => {
            return {
                task_id: task.task_id,
                name: task.name,
                priority: task.priority,
                complation_date: task.complation_date,
                member: {
                    user_id: task.memid,
                    name: task.memname,
                    email: task.mememail
                },
                status: task.status
            }
        })
        return {
            project_id: projects[0].project_id,
            name: projects[0].name,
            description: projects[0].description,
            owner: {
                user_id: projects[0].ownid,
                name: projects[0].ownname,
                email: projects[0].ownemail
            },
            tasks: mapTasks
        }
    }
}

export default new ProjectService();