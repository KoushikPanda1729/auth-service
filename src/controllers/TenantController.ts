import { type NextFunction, type Request, type Response } from "express";
import type { TenantService } from "../services/TenantService";
import type { Logger } from "winston";

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
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : undefined;
            const offset = req.query.offset
                ? parseInt(req.query.offset as string)
                : undefined;

            const tenants = await this.tenantService.findAll(
                limit,
                offset,
                req.user?.sub,
                req.user?.role
            );

            this.logger.info(`Retrieved ${tenants.length} tenants`);

            res.status(200).json(tenants);
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
