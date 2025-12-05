import { Router, type Request, type Response } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/userService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";

const authRouter = Router();

authRouter.post("/register", async (req: Request, res: Response) => {
    const userRepository = AppDataSource.getRepository(User);
    const userService = new UserService(userRepository);
    const authController = new AuthController(userService);
    return authController.register(req, res);
});

export default authRouter;
