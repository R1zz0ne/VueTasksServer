import PGInterface from "../ORM/PGInterface";
import {io} from "../index";

class NotificationService {
    async getNotificationLog(userId: number): Promise<any> {
        const notifications = await PGInterface.select({
            table: '"notificationLog"',
            fields: ['"notificationId"', '"message"', '"isChecked"', '"createdAt"', '"tasks"."taskId"', '"tasks"."name"'],
            join: [{
                type: 'INNER JOIN',
                table: '"tasks"',
                firstId: '"tasks"."taskId"',
                secondId: '"notificationLog"."taskId"'
            }],
            condition: `"userId"=${userId}`,
            order: '"notificationId" ASC'
        })
        return notifications
    }

    async addNotification(taskId: number, userId: number, message: string): Promise<any> {
        const nowDate = new Date().toUTCString();
        const notification = await PGInterface.insert({
            table: '"notificationLog"',
            fields: ['"taskId"', '"userId"', '"message"', '"isChecked"', '"createdAt"'],
            values: [`${taskId}`, `${userId}`, `'${message}'`, false, `'${nowDate}'`],
            returns: ['*']
        })
        const userData = await PGInterface.select({
            table: '"users"',
            fields: ['"socketId"'],
            condition: `"userId"=${userId}`
        })
        const taskData = await PGInterface.select({
            table: '"tasks"',
            fields: ['"taskId"', '"name"'],
            condition: `"taskId"=${taskId}`
        })
        io.to(userData[0].socket_id).emit('getNewNotification', {
            isChecked: notification[0].isChecked,
            message: notification[0].message,
            name: taskData[0].name,
            notificationId: notification[0].notificationId,
            taskId: taskData[0].taskId,
            createdAt: notification[0].createdAt,
        })
    }

    async checkNotification(notificationId: number): Promise<any> {
        const notification = await PGInterface.update({
            table: '"notificationLog"',
            set: ['"isChecked"=true'],
            condition: `"notificationId"=${notificationId}`,
            returns: ['"notificationId"', '"isChecked"']
        })
        return notification[0];
    }
}

export default new NotificationService();