import "reflect-metadata";
import app from "./app";
import { Config } from "./config/index";
import logger from "./config/logger";
import { AppDataSource } from "./config/data-source";
import { User } from "./entity/User";
import { roles } from "./constants";
import bcrypt from "bcrypt";

const createAdminUser = async () => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } =
        Config;

    if (
        !ADMIN_EMAIL ||
        !ADMIN_PASSWORD ||
        !ADMIN_FIRST_NAME ||
        !ADMIN_LAST_NAME
    ) {
        logger.warn(
            "Admin user credentials not configured. Skipping admin creation."
        );
        return;
    }

    try {
        const userRepository = AppDataSource.getRepository(User);

        // Check if admin user already exists
        const existingAdmin = await userRepository.findOne({
            where: { email: ADMIN_EMAIL },
        });

        if (existingAdmin) {
            logger.info("Admin user already exists. Skipping creation.");
            return;
        }

        // Create admin user
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

        const adminUser = userRepository.create({
            firstName: ADMIN_FIRST_NAME,
            lastName: ADMIN_LAST_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: roles.ADMIN,
        });

        await userRepository.save(adminUser);
        logger.info("Admin user created successfully", {
            email: ADMIN_EMAIL,
        });
    } catch (error) {
        // If error is due to unique constraint violation (race condition), log and continue
        if (error instanceof Error && error.message.includes("duplicate key")) {
            logger.info(
                "Admin user already exists (created by another instance)."
            );
        } else {
            logger.error("Error creating admin user:", { error });
            throw error;
        }
    }
};

const startServer = async () => {
    const { PORT } = Config;
    try {
        await AppDataSource.initialize();
        logger.info("Database connected successfully");

        // Create admin user after database initialization
        await createAdminUser();

        app.listen(PORT, () =>
            logger.info(`Server is running on port ${PORT}`)
        );
    } catch (error) {
        logger.error("Error starting server:", { error });
        process.exit(1);
    }
};

void startServer();
