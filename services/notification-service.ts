import PGInterface from "../ORM/PGInterface";
import {io} from "../index";

class NotificationService {
    async getNotificationLog(user_id: number): Promise<any> {
        const notifications = await PGInterface.select({
            table: 'notification_log',
            fields: ['notification_id', 'message', 'is_checked', 'created_at', 'tasks.task_id', 'tasks.name'],
            join: [{
                type: 'INNER JOIN',
                table: 'tasks',
                firstId: 'tasks.task_id',
                secondId: 'notification_log.task_id'
            }],
            condition: `user_id=${user_id}`,
            order: 'notification_id ASC'
        })
        return notifications
    }

    async addNotification(task_id: number, user_id: number, message: string): Promise<any> {
        const nowDate = new Date().toUTCString();
        const notification = await PGInterface.insert({
            table: 'notification_log',
            fields: ['task_id', 'user_id', 'message', 'is_checked', 'created_at'],
            values: [`${task_id}`, `${user_id}`, `'${message}'`, false, `'${nowDate}'`],
            returns: ['*']
        })
        const userData = await PGInterface.select({
            table: 'users',
            fields: ['socket_id'],
            condition: `user_id=${user_id}`
        })
        const taskData = await PGInterface.select({
            table: 'tasks',
            fields: ['task_id', 'name'],
            condition: `task_id=${task_id}`
        })
        io.to(userData[0].socket_id).emit('getNewNotification', {
            is_checked: notification[0].is_checked,
            message: notification[0].message,
            name: taskData[0].name,
            notification_id: notification[0].notification_id,
            task_id: taskData[0].task_id,
            created_at: notification[0].created_at,
        })
    }

    async checkNotification(notification_id: number): Promise<any> {
        const notification = await PGInterface.update({
            table: 'notification_log',
            set: ['is_checked=true'],
            condition: `notification_id=${notification_id}`,
            returns: ['notification_id', 'is_checked']
        })
        return notification[0];
    }
}

export default new NotificationService();