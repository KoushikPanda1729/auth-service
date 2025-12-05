import { Router, type Request, type Response } from "express";
import { AuthController } from "../controllers/AuthController";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/register", (req: Request, res: Response) =>
    authController.register(req, res)
);

export default authRouter;
