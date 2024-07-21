import PGInterface from "../ORM/PGInterface";
import {IOwner, ITask, ITaskStatus, ITasksWithMemberAndProject} from "../models/models";
import OtherService from "./other-service";

class TaskService {
    async createTask(name: string, description: string, priority: number,
                     complation_date: string, project_id: number, member: number) {
        const taskArr: ITask[] = await PGInterface.insert({
            table: 'tasks',
            fields: ['name', 'description', 'priority', 'complation_date', 'project_id', 'member', 'status'],
            values: [`'${name}'`, `'${description}'`, `'${priority}'`, `'${complation_date}'`, `${project_id}`, `${member}`, `'assigned'`],
            returns: ['*']
        })
        const task: ITask = taskArr[0];
        //Создание записи в таблице уведомлений
        await PGInterface.insert({
            table: 'notifications',
            fields: ['task_id', 'scheduled_time', 'status', 'type'],
            values: [`${task.task_id}`, `'${complation_date}'`, `'scheduled'`, `'sla'`],
            returns: ['*']
        })
        //Создание записи в таблице уведомлений
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

    async updateTask(task_id: number, name: string, description: string, priority: number,
                     complation_date: string, project_id: number, memberId: number, status: string) {
        const compDate = await PGInterface.select({
            table: 'tasks',
            fields: ['complation_date'],
            condition: `task_id=${task_id}`
        })
        const taskArr: ITask[] = await PGInterface.update({
            table: 'tasks',
            set: [`name='${name}'`, `description='${description}'`, `priority='${priority}'`,
                `complation_date='${complation_date}'`, `project_id=${project_id}`, `member=${memberId}`, `status='${status}'`],
            condition: `task_id=${task_id}`,
            returns: ['*']
        })
        const notificationrecord = await PGInterface.select({
            table: 'notifications',
            fields: ['notification_id'],
            condition: `task_id=${task_id}`
        })
        if (notificationrecord[0]) {
            if (compDate[0].complation_date !== complation_date) {
                await PGInterface.update({
                    table: 'notifications',
                    set: [`scheduled_time='${complation_date}'`, `status='scheduled'`],
                    condition: `task_id=${task_id}`
                })
            }
        } else {
            await PGInterface.insert({
                table: 'notifications',
                fields: ['task_id', 'scheduled_time', 'status', 'type'],
                values: [`${task_id}`, `'${complation_date}'`, `'scheduled'`, `'sla'`]
            })
        }

        const task: ITask = taskArr[0];
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
                'users.name AS memname', 'users.email AS mememail'],
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
            status: task.status
        }
    }

    async updateStatusTask({task_id, status}: ITaskStatus) {
        const taskArr: ITaskStatus[] = await PGInterface.update({
            table: 'tasks',
            set: [`status='${status}'`],
            condition: `task_id=${task_id}`,
            returns: ['task_id', 'status']
        })
        return taskArr[0];
    }
}

export default new TaskService();