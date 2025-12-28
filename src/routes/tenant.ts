import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { AppDataSource } from "../config/data-source";
import logger from "../config/logger";
import { TenantController } from "../controllers/TenantController";
import { Tenant } from "../entity/Tenant";
import { TenantService } from "../services/TenantService";
import { createTenantValidator } from "../validators/tenant-validator";
import { validateRequest } from "../validators/validate-request";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { roles } from "../constants";

const tenantRouter = Router();

const tenantRepository = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantService, logger);

tenantRouter.post(
    "/create-tenants",
    authenticate,
    authorize([roles.ADMIN]),
    createTenantValidator,
    validateRequest,
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.create(req, res, next)
);

tenantRouter.get(
    "/",
    authenticate,
    authorize([roles.ADMIN, roles.MANAGER, roles.CUSTOMER]),
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.getAll(req, res, next)
);

tenantRouter.get("/:id", (req: Request, res: Response, next: NextFunction) =>
    tenantController.getById(req, res, next)
);

tenantRouter.put(
    "/:id",
    createTenantValidator,
    validateRequest,
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.update(req, res, next)
);

tenantRouter.patch("/:id", (req: Request, res: Response, next: NextFunction) =>
    tenantController.update(req, res, next)
);

tenantRouter.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
    tenantController.delete(req, res, next)
);

export default tenantRouter;
