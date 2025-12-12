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
import { validateRequest } from "../validators/validate-request";

import { RefreshToken } from "../entity/RefreshToken";
import { TokenService } from "../services/TokenService";

const authRouter = Router();

authRouter.post(
    "/register",
    registerValidator,
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
        const userRepository = AppDataSource.getRepository(User);
        const userService = new UserService(userRepository);
        const refreshTokenRepository =
            AppDataSource.getRepository(RefreshToken);
        const tokenService = new TokenService(refreshTokenRepository);
        const authController = new AuthController(
            userService,
            logger,
            tokenService
        );
        return authController.register(req, res, next);
    }
);

export default authRouter;
