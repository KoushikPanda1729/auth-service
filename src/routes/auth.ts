import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { AppDataSource } from "../config/data-source";
import logger from "../config/logger";
import { AuthController } from "../controllers/AuthController";
import { User } from "../entity/User";
import { UserService } from "../services/Userservice";
import { registerValidator } from "../validators/register-validator";
import { loginValidator } from "../validators/login-validator";
import { validateRequest } from "../validators/validate-request";
import { RefreshToken } from "../entity/RefreshToken";
import { TokenService } from "../services/TokenService";
import { authenticate } from "../middleware/authenticate";
import { validateRefreshToken } from "../middleware/validateRefreshToken";
import rateLimit from "express-rate-limit";
import createHttpError from "http-errors";

const authRouter = Router();

const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

const userService = new UserService(userRepository);
const tokenService = new TokenService(refreshTokenRepository);

const authController = new AuthController(userService, logger, tokenService);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, _res: Response, next: NextFunction) => {
        const error = createHttpError(
            429,
            "Too many authentication attempts. You have exceeded the limit of 5 attempts. Please try again after 15 minutes."
        );
        next(error);
    },
});

authRouter.post(
    "/register",
    registerValidator,
    validateRequest,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next)
);

authRouter.post(
    "/login",
    loginValidator,
    validateRequest,
    authLimiter,
    (req: Request, res: Response, next: NextFunction) =>
        authController.login(req, res, next)
);

authRouter.post(
    "/refresh",
    validateRefreshToken,
    (req: Request, res: Response, next: NextFunction) =>
        authController.refresh(req, res, next)
);

authRouter.post(
    "/logout",
    authenticate,
    (req: Request, res: Response, next: NextFunction) =>
        authController.logout(req, res, next)
);

authRouter.get(
    "/self",
    authenticate,
    (req: Request, res: Response, next: NextFunction) =>
        authController.self(req, res, next)
);

export default authRouter;
