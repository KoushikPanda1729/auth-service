import { type NextFunction, type Request, type Response } from "express";
import type { UserService } from "../services/Userservice";
import type { Logger } from "winston";
import type { RegisterBody, PaginatedResponse } from "../types";
import createHttpError from "http-errors";
import type { User } from "../entity/User";

export class UserController {
    private userService: UserService;
    private logger: Logger;

    constructor(userService: UserService, logger: Logger) {
        this.userService = userService;
        this.logger = logger;
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const perPage = req.query.limit
                ? parseInt(req.query.limit as string)
                : 10;

            // Support both page and offset parameters
            let offset: number;
            let currentPage: number;

            if (req.query.offset !== undefined) {
                // If offset is provided, use it directly
                offset = parseInt(req.query.offset as string);
                currentPage = Math.floor(offset / perPage) + 1;
            } else {
                // Otherwise, calculate offset from page number
                currentPage = req.query.page
                    ? parseInt(req.query.page as string)
                    : 1;
                offset = (currentPage - 1) * perPage;
            }

            // Extract search and filter parameters
            const searchQuery = req.query.search
                ? (req.query.search as string)
                : undefined;
            const role = req.query.role
                ? (req.query.role as string)
                : undefined;

            const { users, total } = await this.userService.getAll(
                perPage,
                offset,
                searchQuery,
                role
            );

            const totalPages = Math.ceil(total / perPage);

            const response: PaginatedResponse<User> = {
                data: users,
                pagination: {
                    total,
                    currentPage,
                    perPage,
                    totalPages,
                },
            };

            this.logger.info(`Retrieved ${users.length} users out of ${total}`);

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;

        // Validate ID is a number
        if (isNaN(Number(id))) {
            return next(createHttpError(400, "Invalid user ID"));
        }

        try {
            const user = await this.userService.findById(Number(id));

            if (!user) {
                return next(createHttpError(404, "User not found"));
            }

            this.logger.info(`Retrieved user with id: ${id}`);

            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        const { firstName, lastName, email, role } =
            req.body as Partial<RegisterBody>;

        // Validate ID is a number
        if (isNaN(Number(id))) {
            return next(createHttpError(400, "Invalid user ID"));
        }

        try {
            const updateData: Partial<
                Pick<RegisterBody, "firstName" | "lastName" | "email" | "role">
            > = {};

            if (firstName) updateData.firstName = firstName;
            if (lastName) updateData.lastName = lastName;
            if (email) updateData.email = email;
            if (role) updateData.role = role;

            const updatedUser = await this.userService.update(
                Number(id),
                updateData
            );

            this.logger.info(`Updated user with id: ${id}`);

            res.status(200).json(updatedUser);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;

        // Validate ID is a number
        if (isNaN(Number(id))) {
            return next(createHttpError(400, "Invalid user ID"));
        }

        try {
            await this.userService.delete(Number(id));

            this.logger.info(`Deleted user with id: ${id}`);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
