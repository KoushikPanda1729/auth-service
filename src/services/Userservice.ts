import bcrypt from "bcrypt";
import type { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import type { RegisterBody } from "../types";
import createHttpError from "http-errors";
import { roles } from "../constants";

export class UserService {
    private userRepository: Repository<User>;
    constructor(userRepository: Repository<User>) {
        this.userRepository = userRepository;
    }

    async create({ firstName, lastName, email, password, role }: RegisterBody) {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { email },
        });

        if (user) {
            const error = createHttpError(400, "Email already exists!");
            throw error;
        }

        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const user = await userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: role || roles.CUSTOMER,
            });
            return user;
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
}
