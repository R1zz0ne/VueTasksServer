import PGInterface from "../ORM/PGInterface";
import {IOwner, IProject, IProjectWithOwner, ITasksWithMember} from "../models/models";

class ProjectService {
    async createProject(name: string, description: string, ownerId: number) {
        const projectArr = await PGInterface.insert({
            table: '"projects"',
            fields: ['"name"', '"description"', '"owner"'],
            values: [`'${name}'`, `'${description}'`, `${ownerId}`],
            returns: ['"projectId"', '"name"', '"description"', '"owner"']
        })
        const project: IProject = projectArr[0];
        const ownerInfo: IOwner[] = await PGInterface.select({
            table: '"users"',
            fields: ['"userId"', '"name"', '"email"'],
            condition: `"userId"=${project.owner}`
        })
        return {
            projectId: project.projectId,
            name: project.name,
            description: project.description,
            owner: ownerInfo[0],
            tasks: [],
            editor: null
        }
    }

    async updateProject(id: number, name: string, description: string, ownerId: number) {
        const projectArr = await PGInterface.update({
            table: '"projects"',
            set: [`"name"='${name}'`, `"description"='${description}'`, `"owner"=${ownerId}`],
            condition: `"projectId"=${id}`,
            returns: ['*']
        })
        const project: IProject = projectArr[0];
        const ownerInfo: IOwner[] = await PGInterface.select({
            table: '"users"',
            fields: ['"userId"', '"name"', '"email"'],
            condition: `"userId"=${project.owner}`
        })
        return {
            projectId: project.projectId,
            name: project.name,
            description: project.description,
            owner: ownerInfo[0]
        }
    }

    async getProjectList(data: { page: number }) {
        const limit: number = 20;
        const projects: IProjectWithOwner[] = await PGInterface.select({
            table: '"projects"',
            fields: ['"projectId"', '"name"'],
            order: '"projectId"',
            limit: limit,
            offset: (data.page - 1) * limit
        })
        return projects;
    }

    async getProject(id: number) {
        const projects: IProjectWithOwner[] = await PGInterface.select({
            table: '"projects"',
            fields: ['"projects"."projectId"', '"projects"."name"', '"projects"."description"',
                '"users"."userId" AS "ownId"', '"users"."name" AS "ownName"', '"users"."email" AS "ownEmail"',
                '"editorUser"."userId" AS "editId"', '"editorUser"."name" AS "editName"'],
            join: [{
                type: 'INNER JOIN',
                table: '"users"',
                firstId: '"users"."userId"',
                secondId: '"projects"."owner"'
            }, {
                type: 'LEFT JOIN',
                table: '"users" AS "editorUser"',
                firstId: '"editorUser"."userId"',
                secondId: '"projects"."editor"'
            }],
            condition: `"projects"."projectId"=${id}`
        })
        const tasks: ITasksWithMember[] = await PGInterface.select({
            table: '"tasks"',
            fields: ['"tasks"."taskId"', '"tasks"."name"', '"tasks"."priority"', '"tasks"."completionDate"',
                '"tasks"."status"', '"users"."userId" AS "memId"', '"users"."name" AS "memName"', '"users"."email" AS "memEmail"'],
            join: [{
                type: 'INNER JOIN',
                table: '"users"',
                firstId: '"users"."userId"',
                secondId: '"tasks"."member"'
            }],
            condition: `"tasks"."projectId"=${id}`
        })
        const mapTasks = tasks.map((task) => {
            return {
                taskId: task.taskId,
                name: task.name,
                priority: task.priority,
                completionDate: task.completionDate,
                member: {
                    userId: task.memId,
                    name: task.memName,
                    email: task.memEmail
                },
                status: task.status
            }
        })
        return {
            projectId: projects[0].projectId,
            name: projects[0].name,
            description: projects[0].description,
            owner: {
                userId: projects[0].ownId,
                name: projects[0].ownName,
                email: projects[0].ownEmail
            },
            tasks: mapTasks,
            editor: projects[0].editId ? {userId: projects[0].editId, name: projects[0].editName} : null
        }
    }

    async updateEditor({projectId, editor}: Pick<IProject, 'projectId' | 'editor'>) {
        const projectArr = await PGInterface.update({
            table: '"projects"',
            set: [`"editor"=${editor}`],
            condition: `"projectId"=${projectId}`,
            returns: ['"projectId"', '"editor"']
        })
        if (typeof projectArr[0].editor === 'number') {
            const user = await PGInterface.select({
                table: '"users"',
                fields: ['"userId"', '"name"'],
                condition: `"userId"=${projectArr[0].editor}`
            })
            return {
                projectId: projectArr[0].projectId,
                editor: {
                    userId: user[0].userId,
                    name: user[0].name,
                }
            }
        } else {
            return {
                projectId: projectId,
                editor: null
            }
        }
    }
}

export default new ProjectService();