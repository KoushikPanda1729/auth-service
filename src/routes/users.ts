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
import { RefreshToken } from "../entity/RefreshToken";
import { TokenService } from "../services/TokenService";
import { registerValidator } from "../validators/register-validator";
import { validateRequest } from "../validators/validate-request";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { roles } from "../constants";

const usersRouter = Router();

const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

const userService = new UserService(userRepository);
const tokenService = new TokenService(refreshTokenRepository);

const authController = new AuthController(userService, logger, tokenService);

usersRouter.post(
    "/create-manager",
    authenticate,
    authorize([roles.ADMIN]),
    registerValidator,
    validateRequest,
    (req: Request, res: Response, next: NextFunction) =>
        authController.createManager(req, res, next)
);

export default usersRouter;
