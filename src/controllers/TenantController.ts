import { Request, NextFunction, Response } from "express";
import { TenantService } from "../services/tenantService";
import { IQueryParams, TenantRequest } from "../types";
import { Logger } from "winston";
import { matchedData, validationResult } from "express-validator";
import createHttpError from "http-errors";
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly logger: Logger,
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
    const validatedQuery = matchedData(req, { onlyValidData: true });
    try {
      const [tenants, count] = await this.tenantService.getAll(
        validatedQuery as IQueryParams,
      );
      res.json({
        currentPage: validatedQuery.currentPage,
        perPage: validatedQuery.perPage,
        total: count,
        data: tenants,
      });
    } catch (err) {
      next(err);
      return;
    }
  }
  async getById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      const error = createHttpError(400, "Invalid url param.");
      next(error);
      return;
    }
    this.logger.debug("Request to fetch tenant by id", { id });
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
    if (isNaN(Number(id))) {
      const error = createHttpError(400, "Invalid url param.");
      next(error);
      return;
    }

    this.logger.debug("Request to delete tenant", { id });
    try {
      await this.tenantService.deleteById(Number(id));
      this.logger.info("Tenant delete successful", { id });
      res.json();
    } catch (err) {
      next(err);
      return;
    }
  }
  async updateById(req: TenantRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { id } = req.params;
    if (isNaN(Number(id))) {
      const error = createHttpError(400, "Invalid url param.");
      next(error);
      return;
    }
    const { name, address } = req.body;
    this.logger.debug("Request to update tenant", { id, name, address });
    try {
      await this.tenantService.updateById(Number(id), { name, address });
      this.logger.info("Tenant update successful", { id });
      res.json();
    } catch (err) {
      next(err);
      return;
    }
  }
}
