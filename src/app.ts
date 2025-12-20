import "reflect-metadata";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import logger from "./config/logger";
import type { HttpError } from "http-errors";
import authRouter from "./routes/auth";
import jwksRouter from "./routes/jwks";
import tenantRouter from "./routes/tenant";
import usersRouter from "./routes/users";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { AppDataSource } from "./config/data-source";
import { Config } from "./config";

const app = express();

// Security middleware
app.use(helmet());
app.use(
    cors({
        origin: Config.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.status(200).send("Wellcome to auth service");
});

app.get("/health", async (req: Request, res: Response) => {
    try {
        // Import JwksService dynamically to avoid circular dependencies
        const { JwksService } = await import("./services/JwksService");

        // Check JWKS availability
        let jwksStatus = "unavailable";
        try {
            await JwksService.getJwks();
            jwksStatus = "available";
        } catch (error) {
            logger.error("JWKS health check failed", { error });
            jwksStatus = "error";
        }

        res.status(200).json({
            status: "ok",
            environment: Config.NODE_ENV,
            timestamp: new Date().toISOString(),
            services: {
                database: AppDataSource.isInitialized
                    ? "connected"
                    : "disconnected",
                jwks: jwksStatus,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            environment: Config.NODE_ENV,
            timestamp: new Date().toISOString(),
            error: "Health check failed : " + (error as Error).message,
        });
    }
});

// JWKS endpoint for public key discovery
app.use(jwksRouter);

app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", usersRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                message: err.message,
                path: "",
                location: "",
            },
        ],
    });
});
export default app;
