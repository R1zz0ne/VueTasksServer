import PGInterface from "../ORM/PGInterface";
import ApiError from "../exceptions/api-error";
import bcrypt from "bcrypt";
import tokenService from "./token-service";
import {JwtPayload} from "jsonwebtoken";
import UserDTO from "../dtos/UserDTO";


class UserService {
    async registration(email: string, password: string, name: string) {
        const checkAvailabilityEmail = await PGInterface.select({
            table: '"users"',
            fields: ['*'],
            condition: `"email"='${email}'`
        })
        if (checkAvailabilityEmail.length > 0) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`)
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const user = await PGInterface.insert({
            table: '"users"',
            fields: ['"email"', '"password"', '"name"'],
            values: [`'${email}'`, `'${hashPassword}'`, `'${name}'`],
            returns: ['"userId"', '"email"', '"name"']
        })
        const userDTO = new UserDTO(user[0]);
        const tokens = tokenService.generateTokens({...userDTO});
        await tokenService.saveToken(userDTO.userId, tokens.refreshToken);
        return {...tokens, user: userDTO}
    }

    async login(email: string, password: string) {
        const user = await PGInterface.select({
            table: '"users"',
            fields: ['*'],
            condition: `"email"='${email}'`
        })
        if (user.length === 0) {
            throw ApiError.BadRequest('Пользователь с таким email не найден')
        }
        const isPassEquals = await bcrypt.compare(password, user[0].password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный логин или пароль')
        }
        const userDTO = new UserDTO(user[0]);
        const tokens = tokenService.generateTokens({...userDTO});
        await tokenService.saveToken(userDTO.userId, tokens.refreshToken);
        return {...tokens, user: userDTO}
    }

    async logout(refreshToken: string) {
        return await tokenService.removeToken(refreshToken);
    }

    async refresh(refreshToken: string) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken) as JwtPayload;
        const tokenFromDB = await tokenService.findToken(refreshToken);
        if (!userData || !tokenFromDB) {
            throw ApiError.UnauthorizedError();
        }
        const user = await PGInterface.select({
            table: '"users"',
            fields: ['*'],
            condition: `"userId"=${userData.userId}`
        })
        const userDTO = new UserDTO(user[0]);
        const tokens = tokenService.generateTokens({...userDTO});
        await tokenService.saveToken(userDTO.userId, tokens.refreshToken);
        return {...tokens, user: userDTO}
    }

    async getUsers(filter: string) {
        const filterString: string = `%${filter}%`
        const users = await PGInterface.select({
            table: '"users"',
            fields: ['"userId"', '"name"', '"email"'],
            condition: `"name" LIKE '${filterString}'`
        })
        console.log(users)
        return users
    }
}

export default new UserService();