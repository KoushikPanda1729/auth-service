import createHttpError from "http-errors";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Config } from "../config";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import { RefreshToken } from "../entity/RefreshToken";
import { type AuthPayload } from "../types";

export class TokenService {
    constructor(private refreshTokenReposity: Repository<RefreshToken>) {}

    generateAccessToken(user: User): string {
        try {
            const token = jwt.sign(
                { sub: user.id, role: user.role },
                Config.PRIVATE_KEY,
                {
                    algorithm: "RS256",
                    expiresIn: "1h",
                }
            );
            return token;
        } catch {
            const error = createHttpError(500, "Error reading private key");
            throw error;
        }
    }

    async generateRefreshToken(user: User): Promise<string> {
        const refreshToken = await this.refreshTokenReposity.save({
            user: user,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        });

        const payload = {
            sub: user.id,
            role: user.role,
            id: refreshToken.id,
        };
        const token = jwt.sign(payload, Config.PRIVATE_KEY, {
            algorithm: "RS256",
            expiresIn: "1y",
            jwtid: String(refreshToken.id),
        });
        return token;
    }

    verifyAccessToken(token: string): AuthPayload {
        try {
            const payload = jwt.verify(token, Config.PUBLIC_KEY, {
                algorithms: ["RS256"],
            }) as JwtPayload;
            return {
                sub: Number(payload.sub),
                role: payload.role as string,
            };
        } catch {
            throw createHttpError(401, "Invalid or expired token");
        }
    }

    verifyRefreshToken(token: string): AuthPayload {
        try {
            const payload = jwt.verify(token, Config.PUBLIC_KEY, {
                algorithms: ["RS256"],
            }) as JwtPayload;

            const authPayload: AuthPayload = {
                sub: Number(payload.sub),
                role: payload.role as string,
            };

            if (payload.id) {
                authPayload.id = Number(payload.id);
            }

            return authPayload;
        } catch {
            throw createHttpError(401, "Invalid or expired refresh token");
        }
    }

    async validateRefreshToken(tokenId: number): Promise<RefreshToken> {
        const token = await this.refreshTokenReposity.findOne({
            where: { id: tokenId },
            relations: ["user"],
        });

        if (!token) {
            throw createHttpError(401, "Refresh token not found or revoked");
        }

        if (token.expiresAt < new Date()) {
            throw createHttpError(401, "Refresh token expired");
        }

        return token;
    }

    async deleteRefreshToken(tokenId: number): Promise<void> {
        await this.refreshTokenReposity.delete({ id: tokenId });
    }

    async deleteAllRefreshTokens(userId: number): Promise<void> {
        await this.refreshTokenReposity.delete({ user: { id: userId } });
    }
}
