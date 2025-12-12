import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { Config } from "../config";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import { RefreshToken } from "../entity/RefreshToken";

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
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1y
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
}
