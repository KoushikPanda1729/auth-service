import { type NextFunction, type Request, type Response } from "express";
import type { RegisterBody } from "../types";
import type { UserService } from "../services/Userservice";
import type { TokenService } from "../services/TokenService";
import type { Logger } from "winston";

export class AuthController {
    private userService: UserService;
    private logger: Logger;
    private tokenService: TokenService;

    constructor(
        userService: UserService,
        logger: Logger,
        tokenService: TokenService
    ) {
        this.userService = userService;
        this.logger = logger;
        this.tokenService = tokenService;
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
            const accessToken = this.tokenService.generateAccessToken(user);
            const refreshToken =
                await this.tokenService.generateRefreshToken(user);

            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 60 * 60 * 1000, // 1h
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1y
            });

            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
        }
    }
}
