import jwt from "jsonwebtoken";
import PGInterface from "../ORM/PGInterface";
import apiError from "../exceptions/api-error";
import "dotenv/config";

declare module "jsonwebtoken" {
    export interface JwtPayload {
        id: number;
        email: string;
        isActivated: boolean;
    }
}

class TokenService {
    generateTokens(payload: object) {
        const accessToken: string = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {expiresIn: '30m'});
        const refreshToken: string = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {expiresIn: '30d'});
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

    validateAccessToken(token: string) {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET!)
        } catch (e) {
            return null;
        }
    }

    validateRefreshToken(token: string) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
        } catch (e: any) {
            return null;
        }
    }

    getUserDataInAuthData(authHead: string | undefined) {
        if (!authHead) {
            throw (apiError.UnauthorizedError());
        }
        const accessToken: string = authHead.split(' ')[1];
        if (!accessToken) {
            throw (apiError.UnauthorizedError())
        }
        const userData = this.validateAccessToken(accessToken);
        if (!userData) {
            throw (apiError.UnauthorizedError())
        }
        return userData
    }
}

export default new TokenService();