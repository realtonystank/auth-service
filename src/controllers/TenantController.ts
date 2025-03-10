import { Request, NextFunction, Response } from "express";
import { TenantService } from "../services/tenantService";
import { TenantRequest } from "../types";
import { Logger } from "winston";
import { validationResult } from "express-validator";
export class TenantController {
  constructor(
    private tenantService: TenantService,
    private logger: Logger,
  ) {}
  async create(req: TenantRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { name, address } = req.body;

    this.logger.debug("Request for creating a tenant", { name, address });

    try {
      const tenant = await this.tenantService.create({ name, address });

      this.logger.info("Tenant has been created", { id: tenant.id });

      res.status(201).json({ id: tenant.id });
    } catch (err) {
      next(err);
    }
  }
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenants = await this.tenantService.getAll();
      res.json(tenants);
    } catch (err) {
      next(err);
      return;
    }
  }
  async getById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const tenant = await this.tenantService.getById(Number(id));
      res.json(tenant);
    } catch (err) {
      next(err);
      return;
    }
  }
  async deleteById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      await this.tenantService.deleteById(Number(id));
      res.json();
    } catch (err) {
      next(err);
      return;
    }
  }
}
