import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { DataSource } from "typeorm";
import app from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { roles } from "../../src/constants";
import { User } from "../../src/entity/User";

describe("Post /auth/register", () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
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
                password: "Password1234",
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
                password: "Password1234",
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
                password: "Password1234",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.find();
            expect(user).toHaveLength(1);
        });
        it("should return the role of the usre", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.find();
            expect(user[0].role).toBe(roles.CUSTOMER);
        });
        it("should store hashed password", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.find();
            expect(user[0].password).not.toBe(userData.password);
            console.log(user[0].password);
        });

        it("should return 400 if email is already registered", async () => {
            const userData = {
                firstName: "John",
                lastName: "Doe",
                email: "johe@gmail.com",
                password: "Password1234",
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
                password: "Password1234",
                role: "customer",
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            expect(response.statusCode).toBe(400);
        });
    });
});
