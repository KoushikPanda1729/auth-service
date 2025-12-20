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
import { roles } from "../../src/constants";
import { User } from "../../src/entity/User";
import { RefreshToken } from "../../src/entity/RefreshToken";
import logger from "../../src/config/logger";

describe("Post /auth/register", () => {
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

    describe("Given all fields are valid", () => {
        it("should return 201 status code", async () => {
            ///AAA - Arrange, Act, Assert
            //  Arrange
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };
            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //Assert

            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.header["content-type"]).toEqual(
                expect.stringContaining("json")
            );
        });

        it("should persists data in the database", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            await request(app).post("/auth/register").send(userData);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.find();
            expect(user).toHaveLength(1);
        });
        it("should return the role of the usre", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            await request(app).post("/auth/register").send(userData);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.find();
            expect(user[0].role).toBe(roles.CUSTOMER);
        });

        it("should return access and refresh tokens in cookies", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.headers["set-cookie"]).toBeDefined();
            expect(response.headers["set-cookie"]).toEqual(
                expect.arrayContaining([
                    expect.stringContaining("accessToken"),
                    expect.stringContaining("refreshToken"),
                ])
            );
        });

        it("should store the refresh token in the database", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            await request(app).post("/auth/register").send(userData);

            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            const tokens = await refreshTokenRepository.find({
                relations: { user: true },
            });

            expect(tokens).toHaveLength(1);
            expect(tokens[0].user).toBeDefined();
        });

        it("should retrieve refresh token with all properties", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            await request(app).post("/auth/register").send(userData);

            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            const tokens = await refreshTokenRepository.find({
                relations: { user: true },
            });

            const token = tokens[0];

            // Verify token properties
            expect(token.id).toBeDefined();
            expect(token.expiresAt).toBeInstanceOf(Date);
            expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
            expect(token.createdAt).toBeInstanceOf(Date);
            expect(token.updatedAt).toBeInstanceOf(Date);

            // Verify user relationship
            expect(token.user).toBeDefined();
            expect(token.user.id).toBeDefined();
            expect(token.user.email).toBe(userData.email);
            expect(token.user.firstName).toBe(userData.firstName);
            expect(token.user.lastName).toBe(userData.lastName);
            expect(token.user.role).toBe(roles.CUSTOMER);
        });

        it("should retrieve refresh token by user id", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            await request(app).post("/auth/register").send(userData);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.findOne({
                where: { email: userData.email },
            });

            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            const tokens = await refreshTokenRepository.find({
                where: { user: { id: user!.id } },
                relations: { user: true },
            });

            expect(tokens).toHaveLength(1);
            expect(tokens[0].user.id).toBe(user!.id);
        });

        it("should store hashed password", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            await request(app).post("/auth/register").send(userData);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.find();
            expect(user[0].password).not.toBe(userData.password);
        });

        it("should return 400 if email is already registered", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: roles.CUSTOMER });
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            expect(response.statusCode).toBe(400);
        });
    });
    describe("Given all fields are invalid", () => {
        it("should return 400 if email is missing", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                password: "Password1234!",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].message).toBe("Email is required");
        });

        it("should return 400 if firstName is missing", async () => {
            const userData = {
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].message).toBe(
                "First name is required"
            );
        });

        it("should return 400 if password is weak", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "123",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].message).toBe(
                "Password should be at least 8 chars"
            );
        });

        it("should return 400 if password does not meet strength requirements", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "password123",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].message).toBe(
                "Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character"
            );
        });
    });

    describe("Given fields requiring trimming", () => {
        it("should trim email before checking uniqueness or saving", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "  john_trim@gmail.com  ",
                password: "Password1234!",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.statusCode).toBe(201);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.findOne({
                where: { email: "john_trim@gmail.com" },
            });
            expect(user).not.toBeNull();
            expect(user!.email).toBe("john_trim@gmail.com");
        });
    });
});
