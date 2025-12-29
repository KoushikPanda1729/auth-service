import bcrypt from "bcrypt";
import type { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { Tenant } from "../entity/Tenant";
import type { RegisterBody } from "../types";
import createHttpError from "http-errors";
import { roles } from "../constants";

export class UserService {
    private userRepository: Repository<User>;
    constructor(userRepository: Repository<User>) {
        this.userRepository = userRepository;
    }

    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: RegisterBody) {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { email },
        });

        if (user) {
            const error = createHttpError(400, "Email already exists!");
            throw error;
        }

        // Validate tenant if tenantId is provided
        if (tenantId) {
            const tenantRepository = AppDataSource.getRepository(Tenant);
            const tenant = await tenantRepository.findOne({
                where: { id: tenantId },
            });

            if (!tenant) {
                const error = createHttpError(400, "Tenant not found");
                throw error;
            }
        }

        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const newUser = await userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: role || roles.CUSTOMER,
                ...(tenantId && { tenant: { id: tenantId } }),
            });
            return newUser;
        } catch {
            const error = createHttpError(500, "Internal Server Error");
            throw error;
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { email },
        });
    }

    async findById(id: number): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { id },
            select: ["id", "firstName", "lastName", "email", "role"],
        });
    }

    async comparePassword(
        plainPassword: string,
        hashedPassword: string
    ): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    async getAll(
        limit?: number,
        offset?: number
    ): Promise<{ users: User[]; total: number }> {
        const options: {
            select?: (keyof User)[];
            take?: number;
            skip?: number;
            order?: { id: "ASC" };
        } = {
            select: ["id", "firstName", "lastName", "email", "role"],
            order: { id: "ASC" },
        };

        if (limit !== undefined) {
            options.take = limit;
        }
        if (offset !== undefined) {
            options.skip = offset;
        }

        const [users, total] = await this.userRepository.findAndCount(options);

        return { users, total };
    }

    async update(
        id: number,
        updateData: Partial<
            Pick<User, "firstName" | "lastName" | "email" | "role">
        >
    ): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw createHttpError(404, "User not found");
        }

        // Check if email is being updated and if it already exists
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: updateData.email },
            });

            if (existingUser) {
                throw createHttpError(400, "Email already exists!");
            }
        }

        try {
            const updatedUser = await this.userRepository.save({
                ...user,
                ...updateData,
            });

            return (await this.findById(updatedUser.id)) as User;
        } catch {
            throw createHttpError(500, "Internal Server Error");
        }
    }

    async delete(id: number): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw createHttpError(404, "User not found");
        }

        try {
            await this.userRepository.remove(user);
        } catch {
            throw createHttpError(500, "Internal Server Error");
        }
    }
}
