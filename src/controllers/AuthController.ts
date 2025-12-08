import { type NextFunction, type Request, type Response } from "express";
import type { RegisterBody } from "../types";
import type { UserService } from "../services/Userservice";
import type { Logger } from "winston";

export class AuthController {
    private userService: UserService;
    private logger: Logger;
    constructor(userService: UserService, logger: Logger) {
        this.userService = userService;
        this.logger = logger;
    }

    async register(req: Request, res: Response, next: NextFunction) {
        const { firstName, lastName, email, password } =
            req.body as RegisterBody;
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });

            this.logger.info(
                `User registered successfully , id :${user.id} and role: ${user.role}`
            );

            res.status(201).json({});
        } catch (error) {
            next(error);
        }
    }
}
