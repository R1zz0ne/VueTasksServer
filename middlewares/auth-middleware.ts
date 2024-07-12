import {NextFunction, Request, Response} from "express";
import apiError from "../exceptions/api-error";
import tokenService from "../services/token-service";

export default function (req: Request, res: Response, next: NextFunction) {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return next(apiError.UnauthorizedError());
        }
        const accessToken = authorizationHeader.split(' ')[1];
        if (!accessToken) {
            return next(apiError.UnauthorizedError());
        }
        const userData = tokenService.validateAccessToken(accessToken);
        if (!userData) {
            return next(apiError.UnauthorizedError());
        }
        next();
    } catch (error) {
        return next(apiError.UnauthorizedError());
    }
}