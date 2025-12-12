import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { Config } from "../config";
import { User } from "../entity/User";

export class TokenService {
    generateAccessToken(user: User) {
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
    generateRefreshToken(user: User) {
        const payload = {
            sub: user.id,
            role: user.role,
        };
        const token = jwt.sign(payload, Config.PRIVATE_KEY, {
            algorithm: "RS256",
            expiresIn: "1y",
        });
        return token;
    }
}
