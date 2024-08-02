import apiError from "../exceptions/api-error";
import tokenService from "../services/token-service";

export default function (data: any, token: any) {
    try {
        if (!token) {
            throw apiError.UnauthorizedError()
        }
        const userData = tokenService.validateAccessToken(token);
        if (!userData) {
            throw apiError.UnauthorizedError()
        }
        return userData
    } catch (error) {
        throw error
    }
}