import jwt from "jsonwebtoken";
import PGInterface from "../ORM/PGInterface";
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
            table: '"tokens"',
            fields: ['"userId"'],
            condition: `"userId"=${userId}`
        })
        if (tokenData.length > 0) {
            return await PGInterface.update({
                table: '"tokens"',
                set: [`"refreshToken"='${refreshToken}'`],
                condition: `"userId"=${userId}`
            })
        }
        return await PGInterface.insert({
            table: '"tokens"',
            fields: ['"userId"', '"refreshToken"'],
            values: [userId, `'${refreshToken}'`]
        })
    }

    async removeToken(refreshToken: string) {
        return await PGInterface.delete({
            table: '"tokens"',
            condition: `"refreshToken"='${refreshToken}'`
        })
    }

    async findToken(refreshToken: string) {
        return await PGInterface.select({
            table: '"tokens"',
            fields: ['*'],
            condition: `"refreshToken"='${refreshToken}'`
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
}

export default new TokenService();