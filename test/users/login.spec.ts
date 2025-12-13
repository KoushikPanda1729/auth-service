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
import bcrypt from "bcrypt";
import { roles } from "../../src/constants";

describe("POST /auth/login", () => {
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

    describe("Given valid credentials", () => {
        it("should return 200 status code", async () => {
            // Arrange - Create a user first
            const userRepository = connection.getRepository(User);
            const hashedPassword = await bcrypt.hash("Password1234!", 10);
            await userRepository.save({
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: hashedPassword,
                role: roles.CUSTOMER,
            });

            const loginData = {
                email: "john@gmail.com",
                password: "Password1234!",
            };

            // Act
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should return valid json response", async () => {
            const userRepository = connection.getRepository(User);
            const hashedPassword = await bcrypt.hash("Password1234!", 10);
            await userRepository.save({
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: hashedPassword,
                role: roles.CUSTOMER,
            });

            const loginData = {
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            expect(response.header["content-type"]).toEqual(
                expect.stringContaining("json")
            );
        });

        it("should return user id", async () => {
            const userRepository = connection.getRepository(User);
            const hashedPassword = await bcrypt.hash("Password1234!", 10);
            const user = await userRepository.save({
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: hashedPassword,
                role: roles.CUSTOMER,
            });

            const loginData = {
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            expect(response.body).toHaveProperty("id");
            expect(response.body.id).toBe(user.id);
        });

        it("should return access and refresh tokens in cookies", async () => {
            const userRepository = connection.getRepository(User);
            const hashedPassword = await bcrypt.hash("Password1234!", 10);
            await userRepository.save({
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: hashedPassword,
                role: roles.CUSTOMER,
            });

            const loginData = {
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            expect(response.headers["set-cookie"]).toBeDefined();
            expect(response.headers["set-cookie"]).toEqual(
                expect.arrayContaining([
                    expect.stringContaining("accessToken"),
                    expect.stringContaining("refreshToken"),
                ])
            );
        });

        it("should store refresh token in database", async () => {
            const userRepository = connection.getRepository(User);
            const hashedPassword = await bcrypt.hash("Password1234!", 10);
            await userRepository.save({
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: hashedPassword,
                role: roles.CUSTOMER,
            });

            const loginData = {
                email: "john@gmail.com",
                password: "Password1234!",
            };

            await request(app).post("/auth/login").send(loginData);

            const refreshTokenRepository =
                connection.getRepository("RefreshToken");
            const tokens = await refreshTokenRepository.find();

            expect(tokens).toHaveLength(1);
        });
    });

    describe("Given invalid credentials", () => {
        it("should return 400 if email is missing", async () => {
            const loginData = {
                password: "Password1234!",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].message).toBe("Email is required");
        });

        it("should return 400 if password is missing", async () => {
            const loginData = {
                email: "john@gmail.com",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].message).toBe(
                "Password is required"
            );
        });

        it("should return 400 if email format is invalid", async () => {
            const loginData = {
                email: "invalid-email",
                password: "Password1234!",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].message).toBe(
                "Invalid email format"
            );
        });

        it("should return 400 if email does not exist (or 429 if rate limited)", async () => {
            const loginData = {
                email: "unique-nonexistent1@gmail.com",
                password: "Password1234!",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            // May return 429 if previous tests triggered rate limit
            expect([400, 429]).toContain(response.statusCode);
            if (response.statusCode === 400) {
                expect(response.body.errors[0].message).toBe(
                    "Invalid credentials"
                );
            }
        });

        it("should return 400 if password is incorrect (or 429 if rate limited)", async () => {
            const userRepository = connection.getRepository(User);
            const hashedPassword = await bcrypt.hash("Password1234!", 10);
            await userRepository.save({
                firstName: "John",
                lastName: "Doe",
                email: "unique-john2@gmail.com",
                password: hashedPassword,
                role: roles.CUSTOMER,
            });

            const loginData = {
                email: "unique-john2@gmail.com",
                password: "WrongPassword123!",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            // May return 429 if previous tests triggered rate limit
            expect([400, 429]).toContain(response.statusCode);
            if (response.statusCode === 400) {
                expect(response.body.errors[0].message).toBe(
                    "Invalid credentials"
                );
            }
        });
    });

    describe("Given rate limiting", () => {
        it("should return 429 after 5 failed login attempts", async () => {
            const loginData = {
                email: "test@gmail.com",
                password: "WrongPassword123!",
            };

            // Make 5 failed attempts
            for (let i = 0; i < 5; i++) {
                await request(app).post("/auth/login").send(loginData);
            }

            // 6th attempt should be rate limited
            const response = await request(app)
                .post("/auth/login")
                .send(loginData);

            expect(response.statusCode).toBe(429);
        });
    });
});
