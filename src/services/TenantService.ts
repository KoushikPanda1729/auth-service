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
        userRole?: string,
        searchQuery?: string
    ): Promise<{ tenants: Tenant[]; total: number }> {
        try {
            // If user is a manager, filter by their assigned tenant
            if (userRole === roles.MANAGER && userId) {
                const userRepository = AppDataSource.getRepository(User);
                const user = await userRepository.findOne({
                    where: { id: userId },
                    relations: ["tenant"],
                });

                if (!user || !user.tenant) {
                    return { tenants: [], total: 0 };
                }

                // Apply search filter to manager's tenant
                if (searchQuery) {
                    const tenant = user.tenant;
                    const matchesSearch =
                        tenant.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        tenant.address
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase());

                    if (!matchesSearch) {
                        return { tenants: [], total: 0 };
                    }
                }

                // Return only the manager's assigned tenant
                return { tenants: [user.tenant], total: 1 };
            }

            // For admin and customer, return all tenants with search
            const queryBuilder = this.tenantRepository
                .createQueryBuilder("tenant")
                .orderBy("tenant.id", "ASC");

            // Apply search filter
            if (searchQuery) {
                queryBuilder.andWhere(
                    "(tenant.name LIKE :search OR tenant.address LIKE :search)",
                    { search: `%${searchQuery}%` }
                );
            }

            // Apply pagination
            if (limit !== undefined) {
                queryBuilder.take(limit);
            }
            if (offset !== undefined) {
                queryBuilder.skip(offset);
            }

            const [tenants, total] = await queryBuilder.getManyAndCount();
            return { tenants, total };
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
