import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { AppDataSource } from "../config/data-source";
import logger from "../config/logger";
import { AuthController } from "../controllers/AuthController";
import { UserController } from "../controllers/UserController";
import { User } from "../entity/User";
import { UserService } from "../services/Userservice";
import { RefreshToken } from "../entity/RefreshToken";
import { TokenService } from "../services/TokenService";
import { createManagerValidator } from "../validators/create-manager-validator";
import { updateUserValidator } from "../validators/update-user-validator";
import { userQueryValidator } from "../validators/user-query-validator";
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
const userController = new UserController(userService, logger);

// Get all users
usersRouter.get(
    "/",
    authenticate,
    authorize([roles.ADMIN]),
    userQueryValidator,
    validateRequest,
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAll(req, res, next)
);

// Get user by ID
usersRouter.get(
    "/:id",
    authenticate,
    authorize([roles.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getById(req, res, next)
);

// Create manager
usersRouter.post(
    "/create-manager",
    authenticate,
    authorize([roles.ADMIN]),
    createManagerValidator,
    validateRequest,
    (req: Request, res: Response, next: NextFunction) =>
        authController.createManager(req, res, next)
);

// Update user
usersRouter.patch(
    "/:id",
    authenticate,
    authorize([roles.ADMIN]),
    updateUserValidator,
    validateRequest,
    (req: Request, res: Response, next: NextFunction) =>
        userController.update(req, res, next)
);

// Delete user
usersRouter.delete(
    "/:id",
    authenticate,
    authorize([roles.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        userController.delete(req, res, next)
);

export default usersRouter;
