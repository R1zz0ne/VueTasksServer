import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {JwtPayload} from "jsonwebtoken";
import NotificationService from "../services/notification-service";
import {Socket} from "socket.io";

class NotificationController {
    async getNotificationLog(data: any, socket: Socket<DefaultEventsMap>, eventName: string, userData: JwtPayload) {
        try {
            const notifications = await NotificationService.getNotificationLog(userData.user_id);
            socket.emit(eventName, notifications);
        } catch (e: any) {
            throw e;
        }
    }
}

export default new NotificationController();