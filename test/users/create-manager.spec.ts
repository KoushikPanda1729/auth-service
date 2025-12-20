import {
    describe,
    expect,
    it,
    beforeAll,
    beforeEach,
    afterAll,
    afterEach,
} from "@jest/globals";
import request from "supertest";
import { DataSource } from "typeorm";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import mockJWKS from "mock-jwks";
import { Config } from "../../src/config";
import { roles } from "../../src/constants";

const createJWKSMock = (mockJWKS as any).default || mockJWKS;

describe("POST /users/create-manager - Create Manager User", () => {
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

    describe("Given valid manager data", () => {
        it("should return 201 status code when super admin creates manager", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.header["content-type"]).toEqual(
                expect.stringContaining("json")
            );
        });

        it("should persist manager in database with manager role", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].role).toBe(roles.MANAGER);
            expect(users[0].email).toBe(managerData.email);
        });

        it("should return created manager id", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.body).toHaveProperty("id");
            expect(typeof response.body.id).toBe("number");
        });

        it("should store hashed password not plain text", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0].password).not.toBe(managerData.password);
            expect(users[0].password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
        });

        it("should trim email before saving", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "  john.manager@example.com  ",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0].email).toBe("john.manager@example.com");
        });
    });

    describe("Given invalid manager data", () => {
        it("should return 400 if firstName is missing", async () => {
            // Arrange
            const managerData = {
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if lastName is missing", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if email is missing", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if password is missing", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if email is invalid format", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "invalid-email",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if password is weak", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "weak",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if email already exists", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Create first manager
            await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Act - Try to create duplicate
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(400);
        });
    });

    describe("Given authentication/authorization", () => {
        it("should return 401 if user is not authenticated", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(401);
        });

        it("should return 403 if user is not a super admin", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            // Create a manager token (not admin)
            const managerToken = jwks.token({
                sub: "1",
                role: roles.MANAGER,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${managerToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(403);
        });

        it("should return 403 if user is a customer", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            // Create a customer token
            const customerToken = jwks.token({
                sub: "1",
                role: roles.CUSTOMER,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${customerToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(403);
        });

        it("should allow super admin to create manager", async () => {
            // Arrange
            const managerData = {
                firstName: "John",
                lastName: "Manager",
                email: "john.manager@example.com",
                password: "Password123!",
            };

            const adminToken = jwks.token({
                sub: "1",
                role: roles.ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/users/create-manager")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(managerData);

            // Assert
            expect(response.statusCode).toBe(201);
        });
    });
});
