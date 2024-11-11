import tokenService from "../services/token-service";
import ApiError from "../exceptions/api-error";

export default function (data: any, token: any) {
    try {
        if (!token) {
            throw ApiError.UnauthorizedError()
        }
        const userData = tokenService.validateAccessToken(token);
        if (!userData) {
            throw ApiError.UnauthorizedError()
        }
        return userData
    } catch (error) {
        throw error
    }
}