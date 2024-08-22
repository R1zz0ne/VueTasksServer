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
                     complation_date: string, project_id: number, member: number) {
        const taskArr: ITask[] = await PGInterface.insert({
            table: 'tasks',
            fields: ['name', 'description', 'priority', 'complation_date', 'project_id', 'member', 'status'],
            values: [`'${name}'`, `'${description}'`, `'${priority}'`, `'${complation_date}'`, `${project_id}`, `${member}`, `'assigned'`],
            returns: ['*']
        })
        const task: ITask = taskArr[0];
        //Создание записи SLA в таблице уведомлений
        await PGInterface.insert({
            table: 'notification_sla',
            fields: ['task_id', 'scheduled_time', 'status', 'type'],
            values: [`${task.task_id}`, `'${complation_date}'`, `'scheduled'`, `'sla'`],
            returns: ['*']
        })
        //Создание записи о назначении задачи в таблице уведомлений
        await NotificationService.addNotification(task.task_id, member, 'Эта задача была назначена вам')
        const memberInfo: IOwner = await OtherService.getUserInfo(task.member);
        const projectInfo = await OtherService.getShortProjectInfo(task.project_id);
        return {
            task_id: task.task_id,
            name: task.name,
            description: task.description,
            priority: task.priority,
            complation_date: task.complation_date,
            project: projectInfo,
            member: memberInfo,
            status: task.status
        };
    }

    async updateTask(task_id: number, name: string, description: string, priority: string,
                     complation_date: string, project_id: number, memberId: number, status: string, userData: JwtPayload) {
        const compDate = await PGInterface.select({
            table: 'tasks',
            fields: ['complation_date'],
            condition: `task_id=${task_id}`
        })
        //получить id пользователя
        const oldUser = await PGInterface.select({
            table: 'tasks',
            fields: ['member'],
            condition: `task_id=${task_id}`
        })
        //обновление задачи
        const taskArr: ITask[] = await PGInterface.update({
            table: 'tasks',
            set: [`name='${name}'`, `description='${description}'`, `priority='${priority}'`,
                `complation_date='${complation_date}'`, `project_id=${project_id}`, `member=${memberId}`, `status='${status}'`],
            condition: `task_id=${task_id}`,
            returns: ['*']
        })
        const notificationrecord = await PGInterface.select({
            table: 'notification_sla',
            fields: ['notification_id'],
            condition: `task_id=${task_id}`
        })
        if (notificationrecord[0]) {
            if (compDate[0].complation_date !== complation_date) {
                await PGInterface.update({
                    table: 'notification_sla',
                    set: [`scheduled_time='${complation_date}'`, `status='scheduled'`],
                    condition: `task_id=${task_id}`
                })
            }
        } else {
            await PGInterface.insert({
                table: 'notification_sla',
                fields: ['task_id', 'scheduled_time', 'status', 'type'],
                values: [`${task_id}`, `'${complation_date}'`, `'scheduled'`, `'sla'`]
            })
        }
        const task: ITask = taskArr[0];
        if (oldUser[0].member !== task.member) {
            //Создание уведомления о назначении задачи
            await NotificationService.addNotification(task.task_id, task.member, 'Эта задача была назначена вам')
            //Создание уведомления об изменении назначения задачи
            await NotificationService.addNotification(task.task_id, oldUser[0].member, `${userData.name} изменил(а) назначение задачи, она больше не назначена вам`)
        }
        const memberInfo = await OtherService.getUserInfo(task.member);
        const projectInfo = await OtherService.getShortProjectInfo(task.project_id);
        return {
            task_id: task.task_id,
            name: task.name,
            description: task.description,
            priority: task.priority,
            complation_date: task.complation_date,
            project: projectInfo,
            member: memberInfo,
            status: task.status
        }

    }

    async getUserTasks(user_id: number, condition?: string) {
        if (condition) {
            const taskArr = await PGInterface.select({
                table: 'tasks',
                fields: ['task_id', 'name', 'priority', 'status'],
                condition: `member=${user_id} AND ${condition}`
            })
            return taskArr;
        } else {
            const taskArr = await PGInterface.select({
                table: 'tasks',
                fields: ['task_id', 'name', 'priority', 'status'],
                condition: `member=${user_id}`
            })
            return taskArr;
        }
    }

    async getInfoForTask(task_id: number) {
        const taskArr: ITasksWithMemberAndProject[] = await PGInterface.select({
            table: 'tasks',
            fields: ['tasks.task_id', 'tasks.name', 'tasks.description', 'tasks.priority', 'tasks.complation_date',
                'tasks.status', 'projects.project_id AS proid', 'projects.name AS proname', 'users.user_id AS memid',
                'users.name AS memname', 'users.email AS mememail', 'editor_user.user_id AS editid',
                'editor_user.name AS editname'],
            join: [{
                type: 'INNER JOIN',
                table: 'projects',
                firstId: 'projects.project_id',
                secondId: 'tasks.project_id'
            }, {
                type: 'INNER JOIN',
                table: 'users',
                firstId: 'users.user_id',
                secondId: 'tasks.member'
            }, {
                type: 'LEFT JOIN',
                table: 'users AS editor_user',
                firstId: 'editor_user.user_id',
                secondId: 'tasks.editor'
            }],
            condition: `tasks.task_id=${task_id}`
        })
        const task = taskArr[0];
        return {
            task_id: task.task_id,
            name: task.name,
            description: task.description,
            priority: task.priority,
            complation_date: task.complation_date,
            project: {
                project_id: task.proid,
                name: task.proname
            },
            member: {
                user_id: task.memid,
                name: task.memname,
                email: task.mememail
            },
            status: task.status,
            editor: task.editid ? {user_id: task.editid, name: task.editname} : null
        }

    }

    async updateStatusTask({task_id, status}: ITaskStatusIn) {
        const taskArr: ITaskStatusOut[] = await PGInterface.update({
            table: 'tasks',
            set: [`status='${status}'`],
            condition: `task_id=${task_id}`,
            returns: ['task_id', 'status', 'project_id']
        })
        return taskArr[0];
    }

    async updateEditor({task_id, editor}: Pick<ITask, 'task_id' | 'editor'>): Promise<IUpdateEditor> {
        const taskArr = await PGInterface.update({
            table: 'tasks',
            set: [`editor=${editor}`],
            condition: `task_id=${task_id}`,
            returns: ['task_id', 'editor']
        })
        if (typeof editor === 'number') {
            const user = await PGInterface.select({
                table: 'users',
                fields: ['user_id', 'name'],
                condition: `user_id=${taskArr[0].editor}`,
            })
            return {
                task_id: taskArr[0].task_id,
                editor: {
                    user_id: user[0].user_id,
                    name: user[0].name,
                }
            }
        } else {
            return {
                task_id: taskArr[0].task_id,
                editor: null
            }
        }
    }
}

export default new TaskService();