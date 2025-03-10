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

export default router;
