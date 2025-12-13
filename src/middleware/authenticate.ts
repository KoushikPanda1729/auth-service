import { type Request, type Response, type NextFunction } from "express";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const accessToken = req.cookies.accessToken as string | undefined;

    if (!accessToken) {
        return next(createHttpError(401, "Authentication required"));
    }

    try {
        const refreshTokenRepository =
            AppDataSource.getRepository(RefreshToken);
        const tokenService = new TokenService(refreshTokenRepository);

        const payload = tokenService.verifyAccessToken(accessToken);
        req.user = payload;

        next();
    } catch (error) {
        return next(error);
    }
};
