import { type Request, type Response } from "express";
import type { RegisterBody } from "../types";
import type { UserService } from "../services/userService";

export class AuthController {
    private userService: UserService;
    constructor(userService: UserService) {
        this.userService = userService;
    }

    async register(req: Request, res: Response) {
        const { firstName, lastName, email, password } =
            req.body as RegisterBody;

        await this.userService.create({
            firstName,
            lastName,
            email,
            password,
        });

        res.status(201).json({});
    }
}
