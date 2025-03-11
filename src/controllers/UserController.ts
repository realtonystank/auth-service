import { Response } from "express";
import { NextFunction } from "express-serve-static-core";
import { UserService } from "../services/userService";
import { CreateUserRequest } from "../types";
import { Roles } from "../constants";
import { validationResult } from "express-validator";
export class UserController {
  constructor(private userService: UserService) {}
  async create(req: CreateUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { firstName, lastName, email, password } = req.body;

    try {
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
        role: Roles.MANAGER,
      });

      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
}
