import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { truncateTables } from "../utils";

describe("Post /auth/register", () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await truncateTables(connection);
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
            };
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.find();
            expect(user).toHaveLength(1);
        });
    });
    describe("Given all fields are invalid", () => {});
});
