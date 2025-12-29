import { type Request, type Response, type NextFunction } from "express";
import logger from "../config/logger";

// Track failed auth attempts per IP
const failedAuthAttempts = new Map<
    string,
    { count: number; timestamp: number }
>();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes
const BLOCK_THRESHOLD = 20; // Block after 20 failed attempts in 1 minute
const BLOCK_DURATION = 5 * 60 * 1000; // Block for 5 minutes
const WINDOW_MS = 60 * 1000; // 1 minute window

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of failedAuthAttempts.entries()) {
        if (now - data.timestamp > BLOCK_DURATION) {
            failedAuthAttempts.delete(ip);
        }
    }
}, CLEANUP_INTERVAL);

/**
 * Middleware to detect and block infinite request loops
 * Tracks failed authentication attempts and blocks IPs that exceed threshold
 */
export const detectInfiniteLoop = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const attemptData = failedAuthAttempts.get(clientIp);

    // Check if IP is currently blocked
    if (attemptData) {
        const timeSinceFirstAttempt = now - attemptData.timestamp;

        // Reset counter if window has passed
        if (timeSinceFirstAttempt > WINDOW_MS) {
            failedAuthAttempts.delete(clientIp);
        }
        // Block if threshold exceeded
        else if (attemptData.count >= BLOCK_THRESHOLD) {
            const remainingBlockTime = Math.ceil(
                (BLOCK_DURATION - timeSinceFirstAttempt) / 1000
            );

            logger.warn("Infinite loop detected - blocking IP", {
                ip: clientIp,
                attempts: attemptData.count,
                blockTimeRemaining: `${remainingBlockTime}s`,
                path: req.path,
            });

            return res
                .status(429)
                .set("Retry-After", String(remainingBlockTime))
                .json({
                    errors: [
                        {
                            type: "InfiniteLoopDetected",
                            message: `Too many failed authentication attempts. Your IP has been temporarily blocked. Please try again in ${remainingBlockTime} seconds.`,
                            path: req.path,
                            location: "loop-detection",
                        },
                    ],
                });
        }
    }

    // Store original res.status to intercept error responses
    const originalStatus = res.status.bind(res);
    res.status = function (code: number) {
        // Track 401 responses (auth failures)
        if (code === 401) {
            const current = failedAuthAttempts.get(clientIp) || {
                count: 0,
                timestamp: now,
            };
            failedAuthAttempts.set(clientIp, {
                count: current.count + 1,
                timestamp: current.timestamp,
            });

            logger.warn("Failed authentication attempt tracked", {
                ip: clientIp,
                totalAttempts: current.count + 1,
                path: req.path,
            });
        }

        return originalStatus(code);
    };

    next();
};
