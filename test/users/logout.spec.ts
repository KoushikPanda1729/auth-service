import {
    describe,
    expect,
    it,
    beforeAll,
    beforeEach,
    afterEach,
    afterAll,
} from "@jest/globals";
import request from "supertest";
import { DataSource } from "typeorm";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { RefreshToken } from "../../src/entity/RefreshToken";
import mockJWKS from "mock-jwks";
import { Config } from "../../src/config";
import { roles } from "../../src/constants";

const createJWKSMock = (mockJWKS as any).default || mockJWKS;

describe("POST /auth/logout", () => {
    let connection: DataSource;
    const jwks = createJWKSMock("http://localhost:5501");

    beforeAll(async () => {
        Config.JWKS_URI = "http://localhost:5501/.well-known/jwks.json";
        connection = await AppDataSource.initialize();
        jwks.start();
    });

    afterEach(() => {
        jwks.stop();
    });

    beforeEach(async () => {
        jwks.start();
        const entities = connection.entityMetadatas;
        const tableNames = entities
            .map((entity) => `"${entity.tableName}"`)
            .join(", ");
        await connection.query(
            `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`
        );
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given authenticated user", () => {
        it("should return 200 status code", async () => {
            // Arrange - Register a user
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const userId = registerResponse.body.id;
            const cookies = registerResponse.headers[
                "set-cookie"
            ] as unknown as string[];
            const accessToken = jwks.token({
                sub: String(userId),
                role: roles.CUSTOMER,
            });

            // Get refreshToken from cookies
            const refreshTokenCookie = cookies.find((cookie: string) =>
                cookie.startsWith("refreshToken=")
            )!;

            // Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    refreshTokenCookie,
                ]);

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should return success message", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const userId = registerResponse.body.id;
            const cookies = registerResponse.headers[
                "set-cookie"
            ] as unknown as string[];
            const accessToken = jwks.token({
                sub: String(userId),
                role: roles.CUSTOMER,
            });

            const refreshTokenCookie = cookies.find((cookie: string) =>
                cookie.startsWith("refreshToken=")
            )!;

            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    refreshTokenCookie,
                ]);

            expect(response.body.message).toBe("Logged out successfully");
        });

        it("should clear access and refresh token cookies", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const userId = registerResponse.body.id;
            const cookies = registerResponse.headers[
                "set-cookie"
            ] as unknown as string[];
            const accessToken = jwks.token({
                sub: String(userId),
                role: roles.CUSTOMER,
            });

            const refreshTokenCookie = cookies.find((cookie: string) =>
                cookie.startsWith("refreshToken=")
            )!;

            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    refreshTokenCookie,
                ]);

            expect(response.headers["set-cookie"]).toBeDefined();
            expect(response.headers["set-cookie"]).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/accessToken=;/),
                    expect.stringMatching(/refreshToken=;/),
                ])
            );
        });

        it("should delete refresh token from database", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const userId = registerResponse.body.id;
            const cookies = registerResponse.headers[
                "set-cookie"
            ] as unknown as string[];
            const accessToken = jwks.token({
                sub: String(userId),
                role: roles.CUSTOMER,
            });

            const refreshTokenCookie = cookies.find((cookie: string) =>
                cookie.startsWith("refreshToken=")
            )!;

            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            const tokensBeforeLogout = await refreshTokenRepository.find();
            expect(tokensBeforeLogout).toHaveLength(1);

            await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    refreshTokenCookie,
                ]);

            const tokensAfterLogout = await refreshTokenRepository.find();
            expect(tokensAfterLogout).toHaveLength(0);
        });

        it("should prevent token refresh after logout", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const userId = registerResponse.body.id;
            const cookies = registerResponse.headers[
                "set-cookie"
            ] as unknown as string[];
            const accessToken = jwks.token({
                sub: String(userId),
                role: roles.CUSTOMER,
            });

            const refreshTokenCookie = cookies.find((cookie: string) =>
                cookie.startsWith("refreshToken=")
            )!;

            // Logout
            await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    refreshTokenCookie,
                ]);

            // Try to refresh - should fail because refresh token is deleted
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", cookies);

            expect(response.statusCode).toBe(401);
        });

        it("should not allow refreshing tokens after logout", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const userId = registerResponse.body.id;
            const cookies = registerResponse.headers[
                "set-cookie"
            ] as unknown as string[];
            const accessToken = jwks.token({
                sub: String(userId),
                role: roles.CUSTOMER,
            });

            const refreshTokenCookie = cookies.find((cookie: string) =>
                cookie.startsWith("refreshToken=")
            )!;

            // Logout
            await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    refreshTokenCookie,
                ]);

            // Try to refresh with old token
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", cookies);

            expect(response.statusCode).toBe(401);
        });
    });

    describe("Given unauthenticated user", () => {
        it("should return 401 if no access token provided", async () => {
            const response = await request(app).post("/auth/logout");

            expect(response.statusCode).toBe(401);
        });

        it("should return 401 if access token is invalid", async () => {
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", ["accessToken=invalid-token"]);

            expect(response.statusCode).toBe(401);
        });
    });

    describe("Given edge cases", () => {
        it("should handle logout even if refresh token is already deleted", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const userId = registerResponse.body.id;
            const cookies = (registerResponse.headers["set-cookie"] ||
                []) as unknown as string[];
            const accessToken = jwks.token({
                sub: String(userId),
                role: roles.CUSTOMER,
            });

            const refreshTokenCookie = cookies.find((cookie: string) =>
                cookie.startsWith("refreshToken=")
            )!;

            // Manually delete refresh token
            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            await refreshTokenRepository.clear();

            // Logout should still work
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    refreshTokenCookie,
                ]);

            expect(response.statusCode).toBe(200);
        });
    });
});
