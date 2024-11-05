import PGInterface from "../ORM/PGInterface";
import {
    IOwner,
    ITask,
    ITaskStatusIn,
    ITaskStatusOut,
    ITasksWithMemberAndProject,
    IUpdateEditor
} from "../models/models";
import OtherService from "./other-service";
import {JwtPayload} from "jsonwebtoken";
import NotificationService from "./notification-service";

class TaskService {
    async createTask(name: string, description: string, priority: string,
                     completionDate: string, projectId: number, member: number) {
        const taskArr: ITask[] = await PGInterface.insert({
            table: '"tasks"',
            fields: ['"name"', '"description"', '"priority"', '"completionDate"', '"projectId"', '"member"', '"status"'],
            values: [`'${name}'`, `'${description}'`, `'${priority}'`, `'${completionDate}'`, `${projectId}`, `${member}`, `'assigned'`],
            returns: ['*']
        })
        const task: ITask = taskArr[0];
        //Создание записи SLA в таблице уведомлений
        await PGInterface.insert({
            table: '"notificationSla"',
            fields: ['"taskId"', '"scheduledTime"', '"status"', '"type"'],
            values: [`${task.taskId}`, `'${completionDate}'`, `'scheduled'`, `'sla'`],
            returns: ['*']
        })
        //Создание записи о назначении задачи в таблице уведомлений
        await NotificationService.addNotification(task.taskId, member, 'Эта задача была назначена вам')
        const memberInfo: IOwner = await OtherService.getUserInfo(task.member);
        const projectInfo = await OtherService.getShortProjectInfo(task.projectId);
        return {
            taskId: task.taskId,
            name: task.name,
            description: task.description,
            priority: task.priority,
            completionDate: task.completionDate,
            project: projectInfo,
            member: memberInfo,
            status: task.status
        };
    }

    async updateTask(taskId: number, name: string, description: string, priority: string,
                     completionDate: string, projectId: number, memberId: number, status: string, userData: JwtPayload) {
        const compDate = await PGInterface.select({
            table: '"tasks"',
            fields: ['"completionDate"'],
            condition: `"taskId"=${taskId}`
        })
        //получить id пользователя
        const oldUser = await PGInterface.select({
            table: '"tasks"',
            fields: ['"member"'],
            condition: `"taskId"=${taskId}`
        })
        //обновление задачи
        const taskArr: ITask[] = await PGInterface.update({
            table: '"tasks"',
            set: [`"name"='${name}'`, `"description"='${description}'`, `"priority"='${priority}'`,
                `"completionDate"='${completionDate}'`, `"projectId"=${projectId}`, `"member"=${memberId}`,
                `"status"='${status}'`],
            condition: `"taskId"=${taskId}`,
            returns: ['*']
        })
        const notificationrecord = await PGInterface.select({
            table: '"notificationSla"',
            fields: ['"notificationId"'],
            condition: `"taskId"=${taskId}`
        })
        if (notificationrecord[0]) {
            if (compDate[0].completionDate !== completionDate) {
                await PGInterface.update({
                    table: '"notificationSla"',
                    set: [`"scheduledTime"='${completionDate}'`, `"status"='scheduled'`],
                    condition: `"taskId"=${taskId}`
                })
            }
        } else {
            await PGInterface.insert({
                table: '"notificationSla"',
                fields: ['"taskId"', '"scheduledTime"', '"status"', '"type"'],
                values: [`${taskId}`, `'${completionDate}'`, `'scheduled'`, `'sla'`]
            })
        }
        const task: ITask = taskArr[0];
        if (oldUser[0].member !== task.member) {
            //Создание уведомления о назначении задачи
            await NotificationService.addNotification(task.taskId, task.member, 'Эта задача была назначена вам')
            //Создание уведомления об изменении назначения задачи
            await NotificationService.addNotification(task.taskId, oldUser[0].member, `${userData.name} изменил(а) назначение задачи, она больше не назначена вам`)
        }
        const memberInfo = await OtherService.getUserInfo(task.member);
        const projectInfo = await OtherService.getShortProjectInfo(task.projectId);

        const editor = task.editor ? await PGInterface.select({
            table: 'users',
            fields: ['"userId"', '"name"'],
            condition: `"userId"=${task.editor}`
        }) : null
        return {
            taskId: task.taskId,
            name: task.name,
            description: task.description,
            priority: task.priority,
            completionDate: task.completionDate,
            project: projectInfo,
            member: memberInfo,
            status: task.status,
            editor: editor ? editor : null
        }

    }

    async getUserTasks(userId: number, page: number, condition?: string) {
        const limit: number = 20;
        if (condition) {
            const taskArr = await PGInterface.select({
                table: '"tasks"',
                fields: ['"taskId"', '"name"', '"priority"', '"status"'],
                order: '"taskId" ASC',
                condition: `"member"=${userId} AND ${condition}`,
                limit: limit,
                offset: (page - 1) * limit
            })
            return taskArr;
        } else {
            const taskArr = await PGInterface.select({
                table: '"tasks"',
                fields: ['"taskId"', '"name"', '"priority"', '"status"'],
                order: '"taskId" ASC',
                condition: `"member"=${userId}`,
                limit: limit,
                offset: (page - 1) * limit
            })
            return taskArr;
        }
    }

    async getInfoForTask(taskId: number) {
        const taskArr: ITasksWithMemberAndProject[] = await PGInterface.select({
            table: '"tasks"',
            fields: ['"tasks"."taskId"', '"tasks"."name"', '"tasks"."description"', '"tasks"."priority"', '"tasks"."completionDate"',
                '"tasks"."status"', '"projects"."projectId" AS "proId"', '"projects"."name" AS "proName"', '"users"."userId" AS "memId"',
                '"users"."name" AS "memName"', '"users"."email" AS "memEmail"', '"editorUser"."userId" AS "editId"',
                '"editorUser"."name" AS "editName"'],
            join: [{
                type: 'INNER JOIN',
                table: '"projects"',
                firstId: '"projects"."projectId"',
                secondId: '"tasks"."projectId"'
            }, {
                type: 'INNER JOIN',
                table: '"users"',
                firstId: '"users"."userId"',
                secondId: '"tasks"."member"'
            }, {
                type: 'LEFT JOIN',
                table: '"users" AS "editorUser"',
                firstId: '"editorUser"."userId"',
                secondId: '"tasks"."editor"'
            }],
            condition: `"tasks"."taskId"=${taskId}`
        })
        const task = taskArr[0];
        return {
            taskId: task.taskId,
            name: task.name,
            description: task.description,
            priority: task.priority,
            completionDate: task.completionDate,
            project: {
                projectId: task.proId,
                name: task.proName
            },
            member: {
                userId: task.memId,
                name: task.memName,
                email: task.memEmail
            },
            status: task.status,
            editor: task.editId ? {userId: task.editId, name: task.editName} : null
        }

    }

    async updateStatusTask({taskId, status}: ITaskStatusIn) {
        const taskArr: ITaskStatusOut[] = await PGInterface.update({
            table: '"tasks"',
            set: [`"status"='${status}'`],
            condition: `"taskId"=${taskId}`,
            returns: ['"taskId"', '"status"', '"projectId"']
        })
        return taskArr[0];
    }

    async updateEditor({taskId, editor}: Pick<ITask, 'taskId' | 'editor'>): Promise<IUpdateEditor> {
        const taskArr = await PGInterface.update({
            table: '"tasks"',
            set: [`"editor"=${editor}`],
            condition: `"taskId"=${taskId}`,
            returns: ['"taskId"', '"editor"']
        })
        if (typeof editor === 'number') {
            const user = await PGInterface.select({
                table: '"users"',
                fields: ['"userId"', '"name"'],
                condition: `"userId"=${taskArr[0].editor}`,
            })
            return {
                taskId: taskArr[0].taskId,
                editor: {
                    userId: user[0].userId,
                    name: user[0].name,
                }
            }
        } else {
            return {
                taskId: taskArr[0].taskId,
                editor: null
            }
        }
    }
}

export default new TaskService();