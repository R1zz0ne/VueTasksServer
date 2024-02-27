import jwt from "jsonwebtoken";
import PGInterface from "../ORM/PGInterface";

declare module "jsonwebtoken" {
    export interface JwtPayload {
        id: number;
        email: string;
        isActivated: boolean;
    }
}

class TokenService {
    generateTokens(payload: object) {
        const accessToken: string = jwt.sign(payload, 'jwt-access-secret-r1zz0ne'); //TODO: вынести в .env
        const refreshToken: string = jwt.sign(payload, 'jwt-refresh-secret-r1zz0ne'); //TODO: вынести в .env
        return {
            accessToken,
            refreshToken
        }
    }

    async saveToken(userId: number, refreshToken: string) {
        const tokenData = await PGInterface.select({
            table: 'tokens',
            fields: ['user_id'],
            condition: `user_id=${userId}`
        })
        if (tokenData.length > 0) {
            return await PGInterface.update({
                table: 'tokens',
                set: [`refresh_token='${refreshToken}'`],
                condition: `user_id=${userId}`
            })
        }
        return await PGInterface.insert({
            table: 'tokens',
            fields: ['user_id', 'refresh_token'],
            values: [userId, `'${refreshToken}'`]
        })
    }

    async removeToken(refreshToken: string) {
        return await PGInterface.delete({
            table: 'tokens',
            condition: `refresh_token='${refreshToken}'`
        })
    }

    async findToken(refreshToken: string) {
        return await PGInterface.select({
            table: 'tokens',
            fields: ['*'],
            condition: `refresh_token='${refreshToken}'`
        })
    }

    validateRefreshToken(token: string) {
        try {
            // const userData = jwt.verify(token, 'jwt-refresh-secret-r1zz0ne') //TODO: вынести в .env
            // return userData;
            return jwt.verify(token, 'jwt-refresh-secret-r1zz0ne');
        } catch (e: any) {
            return null;
        }
    }
}

export default new TokenService();