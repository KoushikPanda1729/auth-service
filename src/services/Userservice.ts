import type { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import type { RegisterBody } from "../types";

export class UserService {
    private userRepository: Repository<User>;
    constructor(userRepository: Repository<User>) {
        this.userRepository = userRepository;
    }
    async create({ firstName, lastName, email, password }: RegisterBody) {
        const userRepository = AppDataSource.getRepository(User);
        await userRepository.save({
            firstName,
            lastName,
            email,
            password,
        });
    }
}
