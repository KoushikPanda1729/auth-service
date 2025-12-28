import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { Config } from "../config";
import { roles } from "../constants";
import bcrypt from "bcrypt";
import logger from "../config/logger";

export const initializeAdmin = async () => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } =
        Config;

    // Validate that all admin credentials are provided
    if (
        !ADMIN_EMAIL ||
        !ADMIN_PASSWORD ||
        !ADMIN_FIRST_NAME ||
        !ADMIN_LAST_NAME
    ) {
        logger.warn(
            "Admin credentials not fully configured in environment variables. Skipping admin initialization."
        );
        return;
    }

    try {
        const userRepository = AppDataSource.getRepository(User);

        // Check if admin already exists
        const existingAdmin = await userRepository.findOne({
            where: { email: ADMIN_EMAIL },
        });

        if (existingAdmin) {
            logger.info(`Admin user already exists with email: ${ADMIN_EMAIL}`);
            return;
        }

        // Create admin user
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(
            ADMIN_PASSWORD,
            saltRounds
        );

        const admin = userRepository.create({
            firstName: ADMIN_FIRST_NAME,
            lastName: ADMIN_LAST_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: roles.ADMIN,
        });

        await userRepository.save(admin);

        logger.info(
            `Super admin user created successfully with email: ${ADMIN_EMAIL}`
        );
    } catch (error) {
        logger.error("Error initializing admin user:", { error });
        throw error;
    }
};
