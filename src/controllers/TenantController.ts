import { type NextFunction, type Request, type Response } from "express";
import { matchedData } from "express-validator";
import type { TenantService } from "../services/TenantService";
import type { Logger } from "winston";
import type { PaginatedResponse } from "../types";
import type { Tenant } from "../entity/Tenant";

export interface CreateTenantRequest {
    name: string;
    address: string;
}

export interface UpdateTenantRequest {
    name?: string;
    address?: string;
}

export class TenantController {
    private tenantService: TenantService;
    private logger: Logger;

    constructor(tenantService: TenantService, logger: Logger) {
        this.tenantService = tenantService;
        this.logger = logger;
    }

    async create(req: Request, res: Response, next: NextFunction) {
        const { name, address } = req.body as CreateTenantRequest;

        try {
            const tenant = await this.tenantService.create({
                name,
                address,
            });

            this.logger.info(
                `Tenant created successfully, id: ${tenant.id}, name: ${tenant.name}`
            );

            res.status(201).json({ id: tenant.id });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            // Get validated and sanitized data
            const queryData = matchedData(req, { locations: ["query"] });

            const perPage = (queryData.limit as number) || 10;

            // Support both page and offset parameters
            let offset: number;
            let currentPage: number;

            if (queryData.offset !== undefined) {
                // If offset is provided, use it directly
                offset = queryData.offset as number;
                currentPage = Math.floor(offset / perPage) + 1;
            } else {
                // Otherwise, calculate offset from page number
                currentPage = (queryData.page as number) || 1;
                offset = (currentPage - 1) * perPage;
            }

            const { tenants, total } = await this.tenantService.findAll(
                perPage,
                offset,
                req.user?.sub,
                req.user?.role,
                queryData.search as string | undefined
            );

            const totalPages = Math.ceil(total / perPage);

            const response: PaginatedResponse<Tenant> = {
                data: tenants,
                pagination: {
                    total,
                    currentPage,
                    perPage,
                    totalPages,
                },
            };

            this.logger.info(
                `Retrieved ${tenants.length} tenants out of ${total}`
            );

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);

            const tenant = await this.tenantService.findById(id);

            this.logger.info(
                `Retrieved tenant, id: ${tenant.id}, name: ${tenant.name}`
            );

            res.status(200).json(tenant);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const updateData = req.body as UpdateTenantRequest;

            const tenant = await this.tenantService.update(id, updateData);

            this.logger.info(
                `Tenant updated successfully, id: ${tenant.id}, name: ${tenant.name}`
            );

            res.status(200).json(tenant);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);

            await this.tenantService.delete(id);

            this.logger.info(`Tenant deleted successfully, id: ${id}`);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
