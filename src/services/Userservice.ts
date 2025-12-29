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
        offset?: number,
        searchQuery?: string,
        role?: string
    ): Promise<{ users: User[]; total: number }> {
        const queryBuilder = this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.tenant", "tenant")
            .select([
                "user.id",
                "user.firstName",
                "user.lastName",
                "user.email",
                "user.role",
                "tenant.id",
                "tenant.name",
                "tenant.address",
            ])
            .orderBy("user.id", "ASC");

        // Apply search filter (case-insensitive)
        if (searchQuery) {
            queryBuilder.andWhere(
                "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)",
                { search: `%${searchQuery}%` }
            );
        }

        // Apply role filter
        if (role) {
            queryBuilder.andWhere("user.role = :role", { role });
        }

        // Apply pagination
        if (limit !== undefined) {
            queryBuilder.take(limit);
        }
        if (offset !== undefined) {
            queryBuilder.skip(offset);
        }

        const [users, total] = await queryBuilder.getManyAndCount();

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
