import { Request, Response } from "express";
import { NextFunction } from "express-serve-static-core";
import { UserService } from "../services/userService";
import { CreateUserRequest, IQueryParams, UpdateUserRequest } from "../types";
import { matchedData, validationResult } from "express-validator";
import { Logger } from "winston";
import createHttpError from "http-errors";
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}
  async create(req: CreateUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { firstName, lastName, email, password, tenantId, role } = req.body;
    this.logger.debug("New request to create a user", {
      firstName,
      lastName,
      email,
      tenantId,
      role,
      password: "*****",
    });

    try {
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
      });
      this.logger.info("User has been created", { id: user.id });

      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async fetchAll(req: Request, res: Response, next: NextFunction) {
    const validatedQuery = matchedData(req, { onlyValidData: true });

    try {
      const [users, count] = await this.userService.fetchAll(
        validatedQuery as IQueryParams,
      );
      this.logger.info("Users fetch success");
      res.json({
        currentPage: validatedQuery.currentPage,
        perPage: validatedQuery.perPage,
        data: users,
        total: count,
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  async fetchById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      const error = createHttpError(400, "Invalid url param.");
      next(error);
      return;
    }
    this.logger.debug("Request to fetch user", { id });
    try {
      const user = await this.userService.findById(Number(id));
      res.json(user);
    } catch (err) {
      next(err);
      return;
    }
  }

  async deleteById(req: UpdateUserRequest, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      const error = createHttpError(400, "Invalid url param.");
      next(error);
      return;
    }
    this.logger.debug("Request to delete user", { id });
    try {
      await this.userService.deleteById(Number(id));
      this.logger.info("User successfully deleted", { id });
      res.json();
    } catch (err) {
      next(err);
      return;
    }
  }

  async updateById(req: Request, res: Response, next: NextFunction) {
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

    const { firstName, lastName, email, role, tenantId } = req.body;

    this.logger.debug("Request to update user", { id });
    try {
      const user = await this.userService.updateById(Number(id), {
        firstName,
        lastName,
        email,
        role,
        tenantId,
      });
      res.json(user);
    } catch (err) {
      next(err);
      return;
    }
  }
}
