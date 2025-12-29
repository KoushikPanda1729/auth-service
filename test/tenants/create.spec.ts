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
import { Tenant } from "../../src/entity/Tenant";
import mockJWKS from "mock-jwks";
import { Config } from "../../src/config";
import { roles } from "../../src/constants";

const createJWKSMock = (mockJWKS as any).default || mockJWKS;

describe("Tenant API Tests", () => {
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

    describe("POST /tenants", () => {
        describe("Given all fields are valid", () => {
            it("should return 201 status code", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(201);
            });

            it("should return valid json response", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.header["content-type"]).toEqual(
                    expect.stringContaining("json")
                );
            });

            it("should persist tenant data in the database", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                const tenantRepository = connection.getRepository(Tenant);
                const tenants = await tenantRepository.find();
                expect(tenants).toHaveLength(1);
            });

            it("should return the created tenant with id", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.body).toHaveProperty("id");
                expect(response.body.id).toBeDefined();
            });

            it("should store tenant with correct name and address", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                const tenantRepository = connection.getRepository(Tenant);
                const tenants = await tenantRepository.find();
                expect(tenants[0].name).toBe(tenantData.name);
                expect(tenants[0].address).toBe(tenantData.address);
            });

            it("should set createdAt and updatedAt timestamps", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                const tenantRepository = connection.getRepository(Tenant);
                const tenants = await tenantRepository.find();
                expect(tenants[0].createdAt).toBeInstanceOf(Date);
                expect(tenants[0].updatedAt).toBeInstanceOf(Date);
            });

            it("should return tenant in response body", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.body).toHaveProperty("id");
                expect(typeof response.body.id).toBe("number");
            });
        });

        describe("Given all fields are invalid", () => {
            it("should return 400 if name is missing", async () => {
                // Arrange
                const tenantData = {
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(400);
                expect(response.body.errors[0].message).toBe(
                    "Name is required"
                );
            });

            it("should return 400 if address is missing", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(400);
                expect(response.body.errors[0].message).toBe(
                    "Address is required"
                );
            });

            it("should return 400 if name is empty string", async () => {
                // Arrange
                const tenantData = {
                    name: "",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(400);
                expect(response.body.errors[0].message).toBe(
                    "Name is required"
                );
            });

            it("should return 400 if address is empty string", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(400);
                expect(response.body.errors[0].message).toBe(
                    "Address is required"
                );
            });

            it("should return 400 if name exceeds 100 characters", async () => {
                // Arrange
                const tenantData = {
                    name: "a".repeat(101),
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(400);
                expect(response.body.errors[0].message).toBe(
                    "Name must not exceed 100 characters"
                );
            });

            it("should return 400 if address exceeds 200 characters", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "a".repeat(201),
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(400);
                expect(response.body.errors[0].message).toBe(
                    "Address must not exceed 200 characters"
                );
            });

            it("should return 400 if name contains only whitespace", async () => {
                // Arrange
                const tenantData = {
                    name: "   ",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(400);
                expect(response.body.errors[0].message).toBe(
                    "Name is required"
                );
            });

            it("should return 400 if address contains only whitespace", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "   ",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(400);
                expect(response.body.errors[0].message).toBe(
                    "Address is required"
                );
            });
        });

        describe("Given fields requiring trimming", () => {
            it("should trim name before saving", async () => {
                // Arrange
                const tenantData = {
                    name: "  Test Tenant  ",
                    address: "123 Main Street, City, Country",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                const tenantRepository = connection.getRepository(Tenant);
                const tenants = await tenantRepository.find();
                expect(tenants[0].name).toBe("Test Tenant");
            });

            it("should trim address before saving", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "  123 Main Street, City, Country  ",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                const tenantRepository = connection.getRepository(Tenant);
                const tenants = await tenantRepository.find();
                expect(tenants[0].address).toBe(
                    "123 Main Street, City, Country"
                );
            });

            it("should trim both name and address if both have whitespace", async () => {
                // Arrange
                const tenantData = {
                    name: "  Test Tenant  ",
                    address: "  123 Main Street, City, Country  ",
                };

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                const tenantRepository = connection.getRepository(Tenant);
                const tenants = await tenantRepository.find();
                expect(tenants[0].name).toBe("Test Tenant");
                expect(tenants[0].address).toBe(
                    "123 Main Street, City, Country"
                );
            });
        });

        describe("Given authentication/authorization", () => {
            it("should return 401 if user is not authenticated", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(401);
            });

            it("should return 403 if user is not an admin", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                // Create a non-admin user token
                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.CUSTOMER,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(403);
            });

            it("should allow admin to create tenant", async () => {
                // Arrange
                const tenantData = {
                    name: "Test Tenant",
                    address: "123 Main Street, City, Country",
                };

                // Create an admin token
                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .post("/tenants/create-tenants")
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .send(tenantData);

                // Assert
                expect(response.statusCode).toBe(201);
            });
        });
    });

    describe("GET /tenants", () => {
        describe("Given valid request", () => {
            it("should return 200 status code", async () => {
                // Arrange
                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/tenants")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.statusCode).toBe(200);
            });

            it("should return valid json response", async () => {
                // Arrange
                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/tenants")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.header["content-type"]).toEqual(
                    expect.stringContaining("json")
                );
            });

            it("should return empty array when no tenants exist", async () => {
                // Arrange
                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/tenants")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.body.data).toEqual([]);
                expect(response.body.pagination).toEqual({
                    total: 0,
                    currentPage: 1,
                    perPage: 10,
                    totalPages: 0,
                });
            });

            it("should return all tenants when they exist", async () => {
                // Arrange - Create some tenants
                const tenantRepository = connection.getRepository(Tenant);
                await tenantRepository.save([
                    { name: "Tenant 1", address: "Address 1" },
                    { name: "Tenant 2", address: "Address 2" },
                    { name: "Tenant 3", address: "Address 3" },
                ]);

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/tenants")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.body.data).toHaveLength(3);
                expect(response.body.pagination).toEqual({
                    total: 3,
                    currentPage: 1,
                    perPage: 10,
                    totalPages: 1,
                });
            });

            it("should return tenants with all properties", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                await tenantRepository.save({
                    name: "Test Tenant",
                    address: "Test Address",
                });

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/tenants")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.body.data[0]).toHaveProperty("id");
                expect(response.body.data[0]).toHaveProperty("name");
                expect(response.body.data[0]).toHaveProperty("address");
                expect(response.body.data[0]).toHaveProperty("createdAt");
                expect(response.body.data[0]).toHaveProperty("updatedAt");
            });

            it("should return tenants ordered by id", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                await tenantRepository.save([
                    { name: "Tenant 1", address: "Address 1" },
                    { name: "Tenant 2", address: "Address 2" },
                    { name: "Tenant 3", address: "Address 3" },
                ]);

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act

                const response = await request(app)
                    .get("/tenants")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.body.data[0].id).toBeLessThan(
                    response.body.data[1].id
                );
                expect(response.body.data[1].id).toBeLessThan(
                    response.body.data[2].id
                );
            });
        });

        describe("Given pagination", () => {
            it("should support limit parameter", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                await tenantRepository.save([
                    { name: "Tenant 1", address: "Address 1" },
                    { name: "Tenant 2", address: "Address 2" },
                    { name: "Tenant 3", address: "Address 3" },
                    { name: "Tenant 4", address: "Address 4" },
                    { name: "Tenant 5", address: "Address 5" },
                ]);

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/tenants?limit=2")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination).toEqual({
                    total: 5,
                    currentPage: 1,
                    perPage: 2,
                    totalPages: 3,
                });
            });

            it("should support offset parameter", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                await tenantRepository.save([
                    { name: "Tenant 1", address: "Address 1" },
                    { name: "Tenant 2", address: "Address 2" },
                    { name: "Tenant 3", address: "Address 3" },
                ]);

                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.ADMIN,
                });

                // Act
                const response = await request(app)
                    .get("/tenants?offset=1")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.body.data).toHaveLength(2);
                expect(response.body.data[0].name).toBe("Tenant 2");
                expect(response.body.pagination).toEqual({
                    total: 3,
                    currentPage: 1,
                    perPage: 10,
                    totalPages: 1,
                });
            });
        });

        describe("Given authentication/authorization", () => {
            it("should return 401 if user is not authenticated", async () => {
                // Act
                const response = await request(app).get("/tenants");

                // Assert
                expect(response.statusCode).toBe(401);
            });

            it("should return 200 if user is a customer", async () => {
                // Arrange - Create a customer user token
                const accessToken = jwks.token({
                    sub: "1",
                    role: roles.CUSTOMER,
                });

                // Act
                const response = await request(app)
                    .get("/tenants")
                    .set("Cookie", [`accessToken=${accessToken}`]);

                // Assert
                expect(response.statusCode).toBe(200);
            });
        });
    });

    describe("GET /tenants/:id", () => {
        describe("Given valid request", () => {
            it("should return 200 status code when tenant exists", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                const tenant = await tenantRepository.save({
                    name: "Test Tenant",
                    address: "Test Address",
                });

                // Act
                const response = await request(app).get(
                    `/tenants/${tenant.id}`
                );

                // Assert
                expect(response.statusCode).toBe(200);
                expect(response.body.name).toBe("Test Tenant");
                expect(response.body.address).toBe("Test Address");
            });

            it("should return 404 if tenant does not exist", async () => {
                // Act
                const response = await request(app).get("/tenants/999");

                // Assert
                expect(response.statusCode).toBe(404);
            });
        });
    });

    describe("PUT /tenants/:id", () => {
        describe("Given valid request", () => {
            it("should return 200 status code", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                const tenant = await tenantRepository.save({
                    name: "Old Tenant",
                    address: "Old Address",
                });

                const updateData = {
                    name: "Updated Tenant",
                    address: "Updated Address",
                };

                // Act
                const response = await request(app)
                    .put(`/tenants/${tenant.id}`)
                    .send(updateData);

                // Assert
                expect(response.statusCode).toBe(200);
            });

            it("should update tenant in database", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                const tenant = await tenantRepository.save({
                    name: "Old Tenant",
                    address: "Old Address",
                });

                const updateData = {
                    name: "Updated Tenant",
                    address: "Updated Address",
                };

                // Act
                await request(app)
                    .put(`/tenants/${tenant.id}`)
                    .send(updateData);

                // Assert
                const updatedTenant = await tenantRepository.findOne({
                    where: { id: tenant.id },
                });
                expect(updatedTenant?.name).toBe("Updated Tenant");
                expect(updatedTenant?.address).toBe("Updated Address");
            });
        });
    });

    describe("PATCH /tenants/:id", () => {
        describe("Given valid request", () => {
            it("should return 200 status code", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                const tenant = await tenantRepository.save({
                    name: "Test Tenant",
                    address: "Test Address",
                });

                const patchData = {
                    name: "Patched Tenant",
                };

                // Act
                const response = await request(app)
                    .patch(`/tenants/${tenant.id}`)
                    .send(patchData);

                // Assert
                expect(response.statusCode).toBe(200);
            });

            it("should update only provided fields", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                const tenant = await tenantRepository.save({
                    name: "Test Tenant",
                    address: "Test Address",
                });

                const patchData = {
                    name: "Patched Tenant",
                };

                // Act
                await request(app)
                    .patch(`/tenants/${tenant.id}`)
                    .send(patchData);

                // Assert
                const updatedTenant = await tenantRepository.findOne({
                    where: { id: tenant.id },
                });
                expect(updatedTenant?.name).toBe("Patched Tenant");
                expect(updatedTenant?.address).toBe("Test Address"); // Should remain unchanged
            });
        });
    });

    describe("DELETE /tenants/:id", () => {
        describe("Given valid request", () => {
            it("should return 204 status code", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                const tenant = await tenantRepository.save({
                    name: "Test Tenant",
                    address: "Test Address",
                });

                // Act
                const response = await request(app).delete(
                    `/tenants/${tenant.id}`
                );

                // Assert
                expect(response.statusCode).toBe(204);
            });

            it("should remove tenant from database", async () => {
                // Arrange
                const tenantRepository = connection.getRepository(Tenant);
                const tenant = await tenantRepository.save({
                    name: "Test Tenant",
                    address: "Test Address",
                });

                // Act
                await request(app).delete(`/tenants/${tenant.id}`);

                // Assert
                const deletedTenant = await tenantRepository.findOne({
                    where: { id: tenant.id },
                });
                expect(deletedTenant).toBeNull();
            });
        });
    });
});
