import * as bcrypt from "bcrypt";
import createHttpError from "http-errors";
import type { Repository } from "typeorm";
import { roles } from "../constants";
import { User } from "../entity/User";
import type { RegisterBody } from "../types";

export class UserService {
    private userRepository: Repository<User>;
    constructor(userRepository: Repository<User>) {
        this.userRepository = userRepository;
    }
    async create({ firstName, lastName, email, password }: RegisterBody) {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const user = await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: roles.CUSTOMER,
            });
            return user;
        } catch {
            const error = createHttpError(500, "Internal Server Error");
            throw error;
        }
    }
}
