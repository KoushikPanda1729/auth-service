import { type Request } from "express";
import { expressjwt } from "express-jwt";
import { Config } from "../config";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
import { type AuthPayload } from "../types";
import logger from "../config/logger";

export const validateRefreshToken = expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET,

    algorithms: ["HS256"],

    requestProperty: "user",

    getToken: (req: Request) => {
        const { refreshToken } = req.cookies as Record<string, string>;

        if (refreshToken && refreshToken !== "undefined") {
            return refreshToken;
        }

        return undefined;
    },

    isRevoked: async (req: Request, token) => {
        try {
            const payload = token?.payload as unknown as AuthPayload;
            const tokenId = payload?.id;

            if (!tokenId) {
                logger.error("Refresh token missing ID in payload");
                return true;
            }

            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken);

            const refreshToken = await refreshTokenRepository.findOne({
                where: { id: tokenId },
            });

            // Token not found in database = revoked
            if (!refreshToken) {
                logger.warn("Refresh token not found in database", {
                    tokenId,
                });
                return true;
            }

            // Check if token has expired
            if (refreshToken.expiresAt < new Date()) {
                logger.warn("Refresh token expired", {
                    tokenId,
                    expiresAt: refreshToken.expiresAt,
                });
                return true;
            }

            // Token is valid
            return false;
        } catch (error) {
            logger.error("Error validating refresh token", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            // On error, treat as revoked for security
            return true;
        }
    },
});
