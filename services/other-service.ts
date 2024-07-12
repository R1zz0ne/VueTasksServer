import PGInterface from "../ORM/PGInterface";
import {IOwner, IProject} from "../models/models";

class OtherService {
    async getUserInfo(id: number) {
        const user: IOwner[] = await PGInterface.select({
            table: 'users',
            fields: ['user_id', 'name', 'email'],
            condition: `user_id=${id}`
        })
        return user[0];
    }

    async getShortProjectInfo(id: number) {
        const project: Pick<IProject, 'project_id' | 'name'>[] = await PGInterface.select({
            table: 'projects',
            fields: ['project_id', 'name'],
            condition: `project_id=${id}`
        })
        return project[0];
    }
}

export default new OtherService();