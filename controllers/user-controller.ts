import userService from "../services/user-service";
import {IGetUsersData, IRegistrationData, IRefreshTokenData} from "../models/models";

class UserController {
    async registration(data: IRegistrationData, callback: Function) {
        try {
            const {email, password, name} = data;
            const userData = await userService.registration(email, password, name);
            callback(userData)
        } catch (e: any) {
            throw e;
        }
    }

    async login(data: Omit<IRegistrationData, 'name'>, callback: Function) {
        try {
            const {email, password} = data;
            const userData = await userService.login(email, password);
            callback(userData)
        } catch (e: any) {
            throw e;
        }
    }

    async logout(data: IRefreshTokenData, callback: Function) {
        try {
            await userService.logout(data.refreshToken);
            callback({})
        } catch (e: any) {
            throw e;
        }
    }

    async refresh(data: IRefreshTokenData, callback: Function) {
        try {
            const userData = await userService.refresh(data.refreshToken);
            callback(userData)
        } catch (e: any) {
            throw e;
        }
    }


    async getUsers(data: IGetUsersData, callback: Function) {
        try {
            const users = await userService.getUsers(data.query);
            callback(users);
        } catch (e) {
            throw e;
        }
    }
}

export default new UserController();