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
import rateLimit from "express-rate-limit";
import { detectInfiniteLoop } from "./middleware/detectInfiniteLoop";

const app = express();

// Security middleware
app.use(helmet());
app.use(
    cors({
        // origin: Config.FRONTEND_URL,
        origin: true, // Allow all origins
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// Global rate limiter - protects against infinite request loops
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: {
        errors: [
            {
                type: "RateLimitError",
                message:
                    "Too many requests from this IP, please try again later.",
                path: "",
                location: "",
            },
        ],
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for health check and JWKS endpoints
    skip: (req) => {
        return req.path === "/health" || req.path === "/.well-known/jwks.json";
    },
    handler: (req, res) => {
        logger.warn("Rate limit exceeded", {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(429).json({
            errors: [
                {
                    type: "RateLimitError",
                    message:
                        "Too many requests. Please slow down and try again later.",
                    path: req.path,
                    location: "global",
                },
            ],
        });
    },
});

// Apply global rate limiter to all requests
app.use(globalLimiter);

// Detect and block infinite request loops
app.use(detectInfiniteLoop);

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
    logger.error(err.message, {
        status: err.status || err.statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    const statusCode = err.status || err.statusCode || 500;

    // For JWT errors, add Retry-After header to tell frontend to stop retrying immediately
    if (err.name === "UnauthorizedError" || statusCode === 401) {
        res.set("Retry-After", "0"); // Don't retry - need to refresh token or re-login
        res.set("X-Auth-Error", "true"); // Custom header to help frontend identify auth errors
    }

    // For rate limit errors, tell frontend when they can retry
    if (statusCode === 429) {
        res.set("Retry-After", "60"); // Retry after 60 seconds
    }

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                message: err.message,
                path: req.path || "",
                location: "",
            },
        ],
    });
});
export default app;
