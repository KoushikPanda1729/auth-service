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

describe("GET /auth/self", () => {
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

            const cookies = registerResponse.headers["set-cookie"];

            // Act
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", cookies);

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should return user information", async () => {
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
                .get("/auth/self")
                .set("Cookie", cookies);

            expect(response.body).toHaveProperty("id");
            expect(response.body).toHaveProperty("firstName");
            expect(response.body).toHaveProperty("lastName");
            expect(response.body).toHaveProperty("email");
            expect(response.body).toHaveProperty("role");
        });

        it("should return correct user data", async () => {
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
                .get("/auth/self")
                .set("Cookie", cookies);

            expect(response.body.firstName).toBe(userData.firstName);
            expect(response.body.lastName).toBe(userData.lastName);
            expect(response.body.email).toBe(userData.email);
            expect(response.body.role).toBe(roles.CUSTOMER);
        });

        it("should not return password in response", async () => {
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
                .get("/auth/self")
                .set("Cookie", cookies);

            expect(response.body).not.toHaveProperty("password");
        });

        it("should return json response", async () => {
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
                .get("/auth/self")
                .set("Cookie", cookies);

            expect(response.header["content-type"]).toEqual(
                expect.stringContaining("json")
            );
        });

        it("should work after token refresh", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "john@gmail.com",
                password: "Password1234!",
            };

            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            let cookies = registerResponse.headers["set-cookie"];

            // Refresh tokens
            const refreshResponse = await request(app)
                .post("/auth/refresh")
                .set("Cookie", cookies);

            cookies = refreshResponse.headers["set-cookie"];

            // Get user info with new token
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", cookies);

            expect(response.statusCode).toBe(200);
            expect(response.body.email).toBe(userData.email);
        });
    });

    describe("Given unauthenticated user", () => {
        it("should return 401 if no access token provided", async () => {
            const response = await request(app).get("/auth/self");

            expect(response.statusCode).toBe(401);
            expect(response.body.errors[0].message).toBe(
                "Authentication required"
            );
        });

        it("should return 401 if access token is invalid", async () => {
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", ["accessToken=invalid-token"]);

            expect(response.statusCode).toBe(401);
        });

        it("should return 401 if access token is expired", async () => {
            // This test would require mocking expired tokens
            // For now, test with malformed token
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [
                    "accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
                ]);

            expect(response.statusCode).toBe(401);
        });

        it("should work with valid access token even after logout (JWT limitation)", async () => {
            // Note: Access tokens are stateless JWTs and remain valid until expiry
            // This is a known limitation of JWT-based auth
            // To truly invalidate tokens, you'd need a token blacklist
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

            // Logout
            await request(app).post("/auth/logout").set("Cookie", cookies);

            // Access token still works until expiry (JWT behavior)
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", cookies);

            // Access token is still valid (this is expected with JWT)
            expect(response.statusCode).toBe(200);
        });
    });

    describe("Given different user roles", () => {
        it("should return correct role for customer", async () => {
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
                .get("/auth/self")
                .set("Cookie", cookies);

            expect(response.body.role).toBe(roles.CUSTOMER);
        });
    });
});
