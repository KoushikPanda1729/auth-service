import { type NextFunction, type Request, type Response } from "express";
import type { RegisterBody, LoginBody } from "../types";
import type { UserService } from "../services/Userservice";
import type { TokenService } from "../services/TokenService";
import type { Logger } from "winston";
import createHttpError from "http-errors";
import { roles } from "../constants";

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

    private setAuthCookies(
        res: Response,
        accessToken: string,
        refreshToken: string
    ): void {
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 60 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 365 * 24 * 60 * 60 * 1000,
        });
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

            this.setAuthCookies(res, accessToken, refreshToken);

            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        const { email, password } = req.body as LoginBody;

        try {
            const user = await this.userService.findByEmail(email);

            if (!user) {
                return next(createHttpError(400, "Invalid credentials"));
            }

            const isPasswordValid = await this.userService.comparePassword(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return next(createHttpError(400, "Invalid credentials"));
            }

            this.logger.info(`User logged in successfully, id: ${user.id}`);

            const accessToken = this.tokenService.generateAccessToken(user);
            const refreshToken =
                await this.tokenService.generateRefreshToken(user);

            this.setAuthCookies(res, accessToken, refreshToken);

            res.status(200).json({ id: user.id });
        } catch (error) {
            next(error);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction) {
        const refreshToken = req.cookies.refreshToken as string | undefined;

        if (!refreshToken) {
            return next(createHttpError(401, "Refresh token required"));
        }

        try {
            const payload = this.tokenService.verifyRefreshToken(refreshToken);

            if (!payload.id) {
                return next(createHttpError(401, "Invalid refresh token"));
            }

            const tokenRecord = await this.tokenService.validateRefreshToken(
                Number(payload.id)
            );

            const user = tokenRecord.user;

            this.logger.info(
                `Token refreshed successfully for user id: ${user.id}`
            );

            // Delete old refresh token
            await this.tokenService.deleteRefreshToken(Number(payload.id));

            // Generate new tokens
            const newAccessToken = this.tokenService.generateAccessToken(user);
            const newRefreshToken =
                await this.tokenService.generateRefreshToken(user);

            this.setAuthCookies(res, newAccessToken, newRefreshToken);

            res.status(200).json({ id: user.id });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        const refreshToken = req.cookies.refreshToken as string | undefined;

        try {
            if (refreshToken) {
                const payload =
                    this.tokenService.verifyRefreshToken(refreshToken);

                if (payload.id) {
                    await this.tokenService.deleteRefreshToken(
                        Number(payload.id)
                    );
                }
            }

            this.logger.info(`User logged out successfully`);

            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");

            res.status(200).json({ message: "Logged out successfully" });
        } catch (error) {
            next(error);
        }
    }

    async self(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return next(createHttpError(401, "User not authenticated"));
            }

            const user = await this.userService.findById(req.user.sub);

            if (!user) {
                return next(createHttpError(404, "User not found"));
            }

            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async createManager(req: Request, res: Response, next: NextFunction) {
        const { firstName, lastName, email, password, role, tenantId } =
            req.body as RegisterBody;

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role: role || roles.MANAGER,
                ...(tenantId && { tenantId }),
            });

            this.logger.info(
                `Manager created successfully, id: ${user.id}, role: ${user.role}, tenantId: ${tenantId}`
            );

            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
        }
    }
}
