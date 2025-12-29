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

describe("User Management Endpoints", () => {
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

    describe("GET /users - Get Users List", () => {
        describe("Given authenticated admin user", () => {
            it("should return 200 status code", async () => {
                // Arrange
                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/users")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(200);
            });

            it("should return valid json response", async () => {
                // Arrange
                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/users")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.header["content-type"]).toEqual(
                    expect.stringContaining("json")
                );
            });

            it("should return an array of users", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                await userRepository.save([
                    {
                        firstName: "John",
                        lastName: "Doe",
                        email: "john@example.com",
                        password: "hashedPassword",
                        role: roles.CUSTOMER,
                    },
                    {
                        firstName: "Jane",
                        lastName: "Smith",
                        email: "jane@example.com",
                        password: "hashedPassword",
                        role: roles.MANAGER,
                    },
                ]);

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/users")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination).toEqual({
                    total: 2,
                    currentPage: 1,
                    perPage: 10,
                    totalPages: 1,
                });
            });

            it("should return users with required fields", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/users")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.body.data[0]).toHaveProperty("id");
                expect(response.body.data[0]).toHaveProperty("firstName");
                expect(response.body.data[0]).toHaveProperty("lastName");
                expect(response.body.data[0]).toHaveProperty("email");
                expect(response.body.data[0]).toHaveProperty("role");
            });

            it("should not return password field", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/users")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.body.data[0]).not.toHaveProperty("password");
            });
        });

        describe("Given authentication/authorization", () => {
            it("should return 401 if user is not authenticated", async () => {
                // Act
                const response = await request(app).get("/users");

                // Assert
                expect(response.statusCode).toBe(401);
            });

            it("should return 403 if user is not an admin", async () => {
                // Arrange
                const customerToken = jwks.token({
                    sub: "1",
                    role: roles.CUSTOMER,
                });

                // Act
                const response = await request(app)
                    .get("/users")
                    .set("Cookie", [`accessToken=${customerToken}`]);

                // Assert
                expect(response.statusCode).toBe(403);
            });

            it("should allow admin to get users list", async () => {
                // Arrange
                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/users")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(200);
            });
        });
    });

    describe("GET /users/:id - Get User by ID", () => {
        describe("Given valid user ID", () => {
            it("should return 200 status code", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(200);
            });

            it("should return valid json response", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.header["content-type"]).toEqual(
                    expect.stringContaining("json")
                );
            });

            it("should return user with required fields", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.body).toHaveProperty("id");
                expect(response.body).toHaveProperty("firstName");
                expect(response.body).toHaveProperty("lastName");
                expect(response.body).toHaveProperty("email");
                expect(response.body).toHaveProperty("role");
                expect(response.body.id).toBe(savedUser.id);
                expect(response.body.email).toBe(savedUser.email);
            });

            it("should not return password field", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.body).not.toHaveProperty("password");
            });
        });

        describe("Given invalid user ID", () => {
            it("should return 404 if user does not exist", async () => {
                // Arrange
                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/users/999")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(404);
            });

            it("should return 400 if ID is not a number", async () => {
                // Arrange
                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/users/invalid")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(400);
            });
        });

        describe("Given authentication/authorization", () => {
            it("should return 401 if user is not authenticated", async () => {
                // Act
                const response = await request(app).get("/users/1");

                // Assert
                expect(response.statusCode).toBe(401);
            });

            it("should return 403 if user is not an admin", async () => {
                // Arrange
                const customerToken = jwks.token({
                    sub: "1",
                    role: roles.CUSTOMER,
                });

                // Act
                const response = await request(app)
                    .get("/users/1")
                    .set("Cookie", [`accessToken=${customerToken}`]);

                // Assert
                expect(response.statusCode).toBe(403);
            });

            it("should allow admin to get user by ID", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(200);
            });
        });
    });

    describe("PATCH /users/:id - Update User", () => {
        describe("Given valid update data", () => {
            it("should return 200 status code", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const updateData = {
                    firstName: "Jane",
                    lastName: "Smith",
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .patch(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                expect(response.statusCode).toBe(200);
            });

            it("should return valid json response", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const updateData = {
                    firstName: "Jane",
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .patch(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                expect(response.header["content-type"]).toEqual(
                    expect.stringContaining("json")
                );
            });

            it("should update user in database", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const updateData = {
                    firstName: "Jane",
                    lastName: "Smith",
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .patch(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                const updatedUser = await userRepository.findOne({
                    where: { id: savedUser.id },
                });
                expect(updatedUser?.firstName).toBe(updateData.firstName);
                expect(updatedUser?.lastName).toBe(updateData.lastName);
            });

            it("should return updated user data", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const updateData = {
                    firstName: "Jane",
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .patch(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                expect(response.body).toHaveProperty("id");
                expect(response.body.firstName).toBe(updateData.firstName);
            });

            it("should allow partial updates", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const updateData = {
                    firstName: "Jane",
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .patch(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                expect(response.statusCode).toBe(200);
                expect(response.body.firstName).toBe(updateData.firstName);
                expect(response.body.lastName).toBe(savedUser.lastName);
            });

            it("should update user role", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const updateData = {
                    role: roles.MANAGER,
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .patch(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                const updatedUser = await userRepository.findOne({
                    where: { id: savedUser.id },
                });
                expect(updatedUser?.role).toBe(roles.MANAGER);
            });
        });

        describe("Given invalid update data", () => {
            it("should return 400 if email format is invalid", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const updateData = {
                    email: "invalid-email",
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .patch(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                expect(response.statusCode).toBe(400);
            });

            it("should return 404 if user does not exist", async () => {
                // Arrange
                const updateData = {
                    firstName: "Jane",
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .patch("/users/999")
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                expect(response.statusCode).toBe(404);
            });

            it("should return 400 if ID is not a number", async () => {
                // Arrange
                const updateData = {
                    firstName: "Jane",
                };

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .patch("/users/invalid")
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send(updateData);

                // Assert
                expect(response.statusCode).toBe(400);
            });
        });

        describe("Given authentication/authorization", () => {
            it("should return 401 if user is not authenticated", async () => {
                // Act
                const response = await request(app)
                    .patch("/users/1")
                    .send({ firstName: "Jane" });

                // Assert
                expect(response.statusCode).toBe(401);
            });

            it("should return 403 if user is not an admin", async () => {
                // Arrange
                const customerToken = jwks.token({
                    sub: "1",
                    role: roles.CUSTOMER,
                });

                // Act
                const response = await request(app)
                    .patch("/users/1")
                    .set("Cookie", [`accessToken=${customerToken}`])
                    .send({ firstName: "Jane" });

                // Assert
                expect(response.statusCode).toBe(403);
            });

            it("should allow admin to update user", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .patch(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`])
                    .send({ firstName: "Jane" });

                // Assert
                expect(response.statusCode).toBe(200);
            });
        });
    });

    describe("DELETE /users/:id - Delete User", () => {
        describe("Given valid user ID", () => {
            it("should return 204 status code", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .delete(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(204);
            });

            it("should delete user from database", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .delete(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                const deletedUser = await userRepository.findOne({
                    where: { id: savedUser.id },
                });
                expect(deletedUser).toBeNull();
            });
        });

        describe("Given invalid user ID", () => {
            it("should return 404 if user does not exist", async () => {
                // Arrange
                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .delete("/users/999")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(404);
            });

            it("should return 400 if ID is not a number", async () => {
                // Arrange
                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .delete("/users/invalid")
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(400);
            });
        });

        describe("Given authentication/authorization", () => {
            it("should return 401 if user is not authenticated", async () => {
                // Act
                const response = await request(app).delete("/users/1");

                // Assert
                expect(response.statusCode).toBe(401);
            });

            it("should return 403 if user is not an admin", async () => {
                // Arrange
                const customerToken = jwks.token({
                    sub: "1",
                    role: roles.CUSTOMER,
                });

                // Act
                const response = await request(app)
                    .delete("/users/1")
                    .set("Cookie", [`accessToken=${customerToken}`]);

                // Assert
                expect(response.statusCode).toBe(403);
            });

            it("should allow admin to delete user", async () => {
                // Arrange
                const userRepository = connection.getRepository(User);
                const savedUser = await userRepository.save({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "hashedPassword",
                    role: roles.CUSTOMER,
                });

                const adminToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .delete(`/users/${savedUser.id}`)
                    .set("Cookie", [`accessToken=${adminToken}`]);

                // Assert
                expect(response.statusCode).toBe(204);
            });
        });
    });
});
