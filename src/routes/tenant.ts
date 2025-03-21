import express, { NextFunction, Request, Response } from "express";
import { TenantController } from "../controllers/TenantController";
import { TenantService } from "../services/tenantService";
import { AppDataSource } from "../config/data-source";
import { Tenant } from "../entity/Tenant";
import { canAccess } from "../middlewares/canAccess";
import logger from "../config/logger";
import authenticate from "../middlewares/authenticate";
import { Roles } from "../constants";
import createTenantValidator from "../validators/create-tenant-validator";
import listTenantsValidator from "../validators/list-tenants-validator";

const tenantRepository = AppDataSource.getRepository(Tenant);
const tenantServie = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantServie, logger);

const router = express.Router();

router.post(
  "/",
  authenticate,
  canAccess([Roles.ADMIN]),
  createTenantValidator,
  (req: Request, res: Response, next: NextFunction) =>
    void tenantController.create(req, res, next),
);

router.get(
  "/",
  listTenantsValidator,
  (req: Request, res: Response, next: NextFunction) =>
    void tenantController.getAll(req, res, next),
);

router.get(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  (req: Request, res: Response, next: NextFunction) =>
    void tenantController.getById(req, res, next),
);

router.delete(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN]),
  (req: Request, res: Response, next: NextFunction) =>
    void tenantController.deleteById(req, res, next),
);

router.patch(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN]),
  (req: Request, res: Response, next: NextFunction) =>
    void tenantController.updateById(req, res, next),
);

export default router;
