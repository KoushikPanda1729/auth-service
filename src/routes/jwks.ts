import {
    Router,
    type Request,
    type Response,
    type NextFunction,
} from "express";
import { JwksService } from "../services/JwksService";
import logger from "../config/logger";

const jwksRouter = Router();

/**
 * GET /.well-known/jwks.json
 *
 * Returns the JSON Web Key Set (JWKS) containing public keys for JWT verification.
 * This endpoint follows the OpenID Connect Discovery specification (RFC 8414).
 *
 * Environment Behavior:
 * - Development: Serves public key from local certs/public.pem
 * - Production: Serves public key from production certs/public.pem
 * - Testing: Endpoint exists but tests use mock-jwks instead
 *
 * Security Features:
 * - Public endpoint (no authentication required)
 * - CORS enabled (public keys are meant to be shared)
 * - Aggressive caching (1 hour) to reduce server load
 * - Proper security headers
 *
 * Response Format (RFC 7517):
 * {
 *   "keys": [{
 *     "kty": "RSA",
 *     "use": "sig",
 *     "kid": "auth-service-key-1",
 *     "alg": "RS256",
 *     "n": "...",  // RSA modulus
 *     "e": "AQAB" // RSA exponent
 *   }]
 * }
 *
 * @route GET /.well-known/jwks.json
 * @returns {JWKS} 200 - JSON Web Key Set
 * @returns {Error} 500 - Internal server error if key generation fails
 */
jwksRouter.get(
    "/.well-known/jwks.json",
    async (_req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        try {
            logger.info("JWKS endpoint accessed");

            // Get JWKS from service (cached after first request)
            const jwks = await JwksService.getJwks();

            // Set security and caching headers
            res.setHeader("Content-Type", "application/json; charset=utf-8");

            // Cache-Control: Public and cacheable for 1 hour
            // This reduces server load since public keys rarely change
            res.setHeader("Cache-Control", "public, max-age=3600, immutable");

            // Add ETag for efficient caching
            res.setHeader("ETag", `W/"jwks-${JwksService.isCached()}"`);

            // CORS headers (allow all origins for public keys)
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

            // Security headers
            res.setHeader("X-Content-Type-Options", "nosniff");

            const duration = Date.now() - startTime;
            logger.info("JWKS served successfully", {
                duration: `${duration}ms`,
                cached: JwksService.isCached(),
            });

            res.status(200).json(jwks);
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            const errorStack = error instanceof Error ? error.stack : undefined;

            logger.error("Failed to serve JWKS", {
                error: errorMessage,
                duration: `${duration}ms`,
                stack: errorStack,
            });

            // Create a properly typed Error object for the error handler middleware
            const errorToPass =
                error instanceof Error
                    ? error
                    : new Error("Failed to serve JWKS");

            next(errorToPass);
        }
    }
);

export default jwksRouter;
