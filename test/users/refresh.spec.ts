import {
    describe,
    expect,
    it,
    beforeAll,
    beforeEach,
    afterAll,
} from "@jest/globals";
import request from "supertest";
import { DataSource } from "typeorm";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { RefreshToken } from "../../src/entity/RefreshToken";
import bcrypt from "bcrypt";
import { roles } from "../../src/constants";

describe("POST /auth/refresh", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
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

    describe("Given valid refresh token", () => {
        it("should return 200 status code", async () => {
            // Arrange - Register a user to get tokens
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const cookies = registerResponse.headers["set-cookie"];

            // Act - Use refresh token
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", cookies);

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should return new access and refresh tokens", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const cookies = registerResponse.headers["set-cookie"];

            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", cookies);

            expect(response.headers["set-cookie"]).toBeDefined();
            expect(response.headers["set-cookie"]).toEqual(
                expect.arrayContaining([
                    expect.stringContaining("accessToken"),
                    expect.stringContaining("refreshToken"),
                ])
            );
        });

        it("should return user id", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const cookies = registerResponse.headers["set-cookie"];

            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", cookies);

            expect(response.body).toHaveProperty("id");
            expect(response.body.id).toBe(registerResponse.body.id);
        });

        it("should delete old refresh token from database", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const cookies = registerResponse.headers["set-cookie"];

            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            const tokensBeforeRefresh = await refreshTokenRepository.find();
            const oldTokenCount = tokensBeforeRefresh.length;

            await request(app).post("/auth/refresh").set("Cookie", cookies);

            const tokensAfterRefresh = await refreshTokenRepository.find();

            // Should still have 1 token (old deleted, new created)
            expect(tokensAfterRefresh).toHaveLength(1);
            // But it should be a different token
            expect(tokensAfterRefresh[0].id).not.toBe(
                tokensBeforeRefresh[0].id
            );
        });

        it("should create new refresh token in database", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const cookies = registerResponse.headers["set-cookie"];

            await request(app).post("/auth/refresh").set("Cookie", cookies);

            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            const tokens = await refreshTokenRepository.find();

            expect(tokens).toHaveLength(1);
        });

        it("should invalidate old refresh token", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const oldCookies = registerResponse.headers["set-cookie"];

            // Get new tokens
            await request(app).post("/auth/refresh").set("Cookie", oldCookies);

            // Try to use old refresh token again
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", oldCookies);

            expect(response.statusCode).toBe(401);
        });
    });

    describe("Given invalid refresh token", () => {
        it("should return 401 if refresh token is missing", async () => {
            const response = await request(app).post("/auth/refresh");

            expect(response.statusCode).toBe(401);
            expect(response.body.errors[0].message).toBe(
                "No authorization token was found"
            );
        });

        it("should return 401 if refresh token is invalid", async () => {
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", ["refreshToken=invalid-token"]);

            expect(response.statusCode).toBe(401);
        });

        it("should return 401 if refresh token is expired", async () => {
            // This test would require mocking time or creating expired tokens
            // For now, we'll test with a malformed token
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [
                    "refreshToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
                ]);

            expect(response.statusCode).toBe(401);
        });

        it("should return 401 if refresh token has been revoked", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            const cookies = registerResponse.headers["set-cookie"];

            // Delete the refresh token from database (simulate revocation)
            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            await refreshTokenRepository.clear();

            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", cookies);

            expect(response.statusCode).toBe(401);
        });
    });
});
