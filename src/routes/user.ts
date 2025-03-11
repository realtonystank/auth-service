import express, { NextFunction, Request, Response } from "express";
import authenticate from "../middlewares/authenticate";

import { canAccess } from "../middlewares/canAccess";
import { Roles } from "../constants";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/userService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { CreateUserRequest } from "../types";
import createUserValidator from "../validators/create-user-validator";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.post(
  "/",
  authenticate,
  canAccess([Roles.ADMIN]),
  createUserValidator,
  (req: Request, res: Response, next: NextFunction) =>
    void userController.create(req as CreateUserRequest, res, next),
);
export default router;
