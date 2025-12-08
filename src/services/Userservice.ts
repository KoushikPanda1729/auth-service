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
    async create({ firstName, lastName, email, password }: RegisterBody) {
        try {
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.save({
                firstName,
                lastName,
                email,
                password,
                role: roles.CUSTOMER,
            });
            return user;
        } catch {
            const error = createHttpError(500, "Internal Server Error");
            throw error;
        }
    }
}
