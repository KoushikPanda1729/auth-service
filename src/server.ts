import "reflect-metadata";
import app from "./app";
import { Config } from "./config/index";
import logger from "./config/logger";
import { AppDataSource } from "./config/data-source";

const startServer = async () => {
    const { PORT } = Config;
    try {
        await AppDataSource.initialize();
        logger.info("Database connected successfully");

        app.listen(PORT, () =>
            logger.info(`Server is running on port ${PORT}`)
        );
    } catch (error) {
        logger.error("Error starting server:", { error });
        process.exit(1);
    }
};

void startServer();
