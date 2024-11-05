import PGInterface from "../ORM/PGInterface";
import {IOwner, IProject} from "../models/models";
import {io} from "../index";
import {Socket} from "socket.io";
import TaskService from "./task-service";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import ProjectService from "./project-service";

class OtherService {
    async getUserInfo(id: number) {
        const user: IOwner[] = await PGInterface.select({
            table: '"users"',
            fields: ['"userId"', '"name"', '"email"'],
            condition: `"userId"=${id}`
        })
        return user[0];
    }

    async getShortProjectInfo(id: number) {
        const project: Pick<IProject, 'projectId' | 'name'>[] = await PGInterface.select({
            table: '"projects"',
            fields: ['"projectId"', '"name"'],
            condition: `"projectId"=${id}`
        })
        return project[0];
    }

    async getUserNameForSocketId(room: string) {
        try {
            const data = io.sockets.adapter.rooms.get(room)
            if (data) {
                const arrayData = Array.from(data)
                const stringSocketId = arrayData.join(`','`)
                const users = await PGInterface.select({
                    table: '"users"',
                    fields: ['"userId"', '"name"'],
                    condition: `"socketId" in ('${stringSocketId}')`,
                })
                return users;
            } else {
                return [];
            }
        } catch (e) {
            console.log('getUserNameForSocketId: ' + e)
        }
    }

    async getSocketIdForUserId(id: number): Promise<any> {
        try {
            const data = await PGInterface.select({
                table: '"users"',
                fields: ['"socketId"'],
                condition: `"userId"=${id}`,
            })
            if (data[0]) {
                return data[0].socketId;
            } else {
                return null;
            }
        } catch (e) {
            console.log('getSocketIdForUserId: ' + e)
        }
    }

    async emitToRoom(room: string, eventName: string, data: any) {
        try {
            io.to(room).emit(eventName, data)
        } catch (e) {
            console.log('emitToRoom: ' + e)
        }
    }

    async cleanEditor(type: string, id: string, socketId: string) {
        switch (type) {
            case 'task':
                const taskMeId = await PGInterface.select({
                    table: '"users"',
                    fields: ['"userId"'],
                    condition: `"socketId"='${socketId}'`
                })
                const task: { editor: number }[] = await PGInterface.select({
                    table: '"tasks"',
                    fields: ['"editor"'],
                    condition: `"taskId"=${id}`
                })
                if (taskMeId[0] && task[0].editor === taskMeId[0].userId) {
                    const editorData = await TaskService.updateEditor({
                        taskId: Number(id),
                        editor: null
                    })
                    await this.emitToRoom(`${type}_${id}`, 'updateTaskEditor', editorData)
                }
                break;
            case 'project':
                const projectMeId = await PGInterface.select({
                    table: '"users"',
                    fields: ['"userId"'],
                    condition: `"socketId"='${socketId}'`
                })
                const project: { editor: number }[] = await PGInterface.select({
                    table: '"projects"',
                    fields: ['"editor"'],
                    condition: `"projectId"=${id}`
                })
                if (projectMeId[0] && project[0].editor === projectMeId[0].userId) {
                    const editorData = await ProjectService.updateEditor({
                        projectId: Number(id),
                        editor: null
                    })
                    await this.emitToRoom(`${type}_${id}`, 'updateProjectEditor', editorData)
                }
                break;
        }
    }

    async disconnecting(room: string, socket: Socket<DefaultEventsMap>) {
        try {
            if (room !== socket.id) {
                socket.leave(room);
                const users = await this.getUserNameForSocketId(room)
                const parseNameRoom = room.match(/([a-z, A-Z]*)_([0-9])/)
                if (parseNameRoom) {
                    switch (parseNameRoom[1]) {
                        case 'task':
                            await this.emitToRoom(room, 'task_room', users)
                            break;
                        case 'project':
                            await this.emitToRoom(room, 'project_room', users)
                            break;
                        case 'board':
                            await this.emitToRoom(room, 'board_room', users)
                            break;
                    }
                    await this.cleanEditor(parseNameRoom[1], parseNameRoom[2], socket.id)
                }
            }
        } catch (e) {
            console.log('disconnecting: ', e)
        }
    }

    async getTotalRecord(table: string, condition?: string) {
        const totalCount = await PGInterface.select({
            table: table,
            fields: ['COUNT(*) AS "totalCount"'],
            condition: condition
        })
        return totalCount[0].totalCount
    }
}

export default new OtherService();