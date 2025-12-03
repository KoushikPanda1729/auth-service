import app from "./app";
import { Config } from "./config/index";

const startServer = () => {
    const { PORT } = Config;
    try {
        app.listen(PORT, () =>
            console.log(`Auth service running on port ${PORT}`)
        );
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
};

startServer();
