import { webcrypto } from "node:crypto";
import { exportJWK, importSPKI, type JWK } from "jose";
import { Config } from "../config";
import logger from "../config/logger";

// Polyfill for crypto global (needed for tsx/some Node.js environments)
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as typeof globalThis.crypto;
}

/**
 * JWKS Key interface following RFC 7517 (JSON Web Key)
 * https://datatracker.ietf.org/doc/html/rfc7517
 */
interface JWKSKey extends JWK {
    alg: string; // Algorithm (e.g., "RS256")
    use: string; // Public key use (e.g., "sig" for signature)
    kid: string; // Key ID for identifying which key to use
}

/**
 * JWKS (JSON Web Key Set) interface following RFC 7517
 */
interface JWKS {
    keys: JWKSKey[];
}

/**
 * JwksService - Production-grade JWKS management
 *
 * This service handles the conversion of RSA public keys to JWKS format
 * and provides caching for optimal performance.
 *
 * Environment Behavior:
 * - Development: Serves local public key from certs/public.pem
 * - Production: Serves production public key from certs/public.pem
 * - Testing: Service is available but tests use mock-jwks instead
 */
export class JwksService {
    private static jwksCache: JWKS | null = null;
    private static readonly KEY_ID = "auth-service-key-1";
    private static readonly ALGORITHM = "RS256";

    /**
     * Get JWKS (JSON Web Key Set) containing the public key
     *
     * The JWKS is cached after first generation to avoid repeated
     * expensive cryptographic operations.
     *
     * @returns Promise<JWKS> - JSON Web Key Set
     * @throws Error if public key cannot be converted to JWKS format
     */
    static async getJwks(): Promise<JWKS> {
        // Return cached JWKS if available
        if (this.jwksCache) {
            logger.debug("Returning cached JWKS");
            return this.jwksCache;
        }

        try {
            logger.info("Generating JWKS from public key");

            // Validate that public key exists
            if (!Config.PUBLIC_KEY) {
                throw new Error(
                    "PUBLIC_KEY is not configured. Ensure certs/public.pem exists."
                );
            }

            // Import the public key from PEM format
            const publicKey = await importSPKI(
                Config.PUBLIC_KEY,
                this.ALGORITHM
            );

            // Export as JWK (JSON Web Key)
            const jwk = await exportJWK(publicKey);

            // Validate required JWK fields
            if (!jwk.kty || !jwk.n || !jwk.e) {
                throw new Error(
                    "Invalid public key: missing required JWK fields (kty, n, e)"
                );
            }

            // Build JWKS with required fields per RFC 7517
            const jwks: JWKS = {
                keys: [
                    {
                        ...jwk,
                        alg: this.ALGORITHM, // Algorithm used for signing
                        use: "sig", // Key usage: signature
                        kid: this.KEY_ID, // Key identifier
                    },
                ],
            };

            // Cache the result for future requests
            this.jwksCache = jwks;

            logger.info("JWKS generated and cached successfully", {
                kid: this.KEY_ID,
                alg: this.ALGORITHM,
            });

            return jwks;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            logger.error("Failed to generate JWKS", {
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined,
            });

            throw new Error(`Failed to generate JWKS: ${errorMessage}`);
        }
    }

    /**
     * Clear the JWKS cache
     *
     * Useful for testing or when rotating keys in production.
     * In production, you should implement a strategy for key rotation
     * that doesn't cause downtime.
     */
    static clearCache(): void {
        logger.info("Clearing JWKS cache");
        this.jwksCache = null;
    }

    /**
     * Check if JWKS is cached
     *
     * @returns boolean - true if JWKS is cached
     */
    static isCached(): boolean {
        return this.jwksCache !== null;
    }
}
