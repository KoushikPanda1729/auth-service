import "reflect-metadata";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import logger from "./config/logger";
import type { HttpError } from "http-errors";
import authRouter from "./routes/auth";
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

app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "ok",
        database: AppDataSource.isInitialized ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
    });
});

app.use("/auth", authRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message);
    const statusCode = err.status || 500;
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
