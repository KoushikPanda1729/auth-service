import type { Repository } from "typeorm";
import { Tenant } from "../entity/Tenant";
import createHttpError from "http-errors";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { roles } from "../constants";

export interface CreateTenantData {
    name: string;
    address: string;
}

export interface UpdateTenantData {
    name?: string;
    address?: string;
}

export class TenantService {
    private tenantRepository: Repository<Tenant>;

    constructor(tenantRepository: Repository<Tenant>) {
        this.tenantRepository = tenantRepository;
    }

    async create({ name, address }: CreateTenantData) {
        try {
            const tenant = await this.tenantRepository.save({
                name,
                address,
            });
            return tenant;
        } catch {
            const error = createHttpError(500, "Internal Server Error");
            throw error;
        }
    }

    async findAll(
        limit?: number,
        offset?: number,
        userId?: number,
        userRole?: string
    ) {
        try {
            // If user is a manager, filter by their assigned tenant
            if (userRole === roles.MANAGER && userId) {
                const userRepository = AppDataSource.getRepository(User);
                const user = await userRepository.findOne({
                    where: { id: userId },
                    relations: ["tenant"],
                });

                if (!user || !user.tenant) {
                    return [];
                }

                // Return only the manager's assigned tenant
                return [user.tenant];
            }

            // For admin and customer, return all tenants
            const options: {
                take?: number;
                skip?: number;
                order: { id: "ASC" };
            } = {
                order: { id: "ASC" },
            };

            if (limit !== undefined) {
                options.take = limit;
            }
            if (offset !== undefined) {
                options.skip = offset;
            }

            const tenants = await this.tenantRepository.find(options);
            return tenants;
        } catch {
            const error = createHttpError(500, "Internal Server Error");
            throw error;
        }
    }

    async findById(id: number) {
        try {
            const tenant = await this.tenantRepository.findOne({
                where: { id },
            });
            if (!tenant) {
                const error = createHttpError(404, "Tenant not found");
                throw error;
            }
            return tenant;
        } catch (error) {
            if (error instanceof Error && "statusCode" in error) {
                throw error;
            }
            const httpError = createHttpError(500, "Internal Server Error");
            throw httpError;
        }
    }

    async update(id: number, data: UpdateTenantData) {
        try {
            const tenant = await this.findById(id);
            Object.assign(tenant, data);
            const updatedTenant = await this.tenantRepository.save(tenant);
            return updatedTenant;
        } catch (error) {
            if (error instanceof Error && "statusCode" in error) {
                throw error;
            }
            const httpError = createHttpError(500, "Internal Server Error");
            throw httpError;
        }
    }

    async delete(id: number) {
        try {
            const tenant = await this.findById(id);
            await this.tenantRepository.remove(tenant);
        } catch (error) {
            if (error instanceof Error && "statusCode" in error) {
                throw error;
            }
            const httpError = createHttpError(500, "Internal Server Error");
            throw httpError;
        }
    }
}
