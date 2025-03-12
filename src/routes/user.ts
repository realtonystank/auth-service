import express, { NextFunction, Request, Response } from "express";
import authenticate from "../middlewares/authenticate";

import { canAccess } from "../middlewares/canAccess";
import { Roles } from "../constants";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/userService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { CreateUserRequest, UpdateUserRequest } from "../types";
import createUserValidator from "../validators/create-user-validator";
import updateUserValidator from "../validators/update-user-validator";
import logger from "../config/logger";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService, logger);

router.post(
  "/",
  authenticate,
  canAccess([Roles.ADMIN]),
  createUserValidator,
  (req: Request, res: Response, next: NextFunction) =>
    void userController.create(req as CreateUserRequest, res, next),
);

router.get(
  "/",
  authenticate,
  canAccess([Roles.ADMIN]),
  (req: Request, res: Response, next: NextFunction) =>
    void userController.fetchAll(req, res, next),
);

router.get(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN]),
  (req: Request, res: Response, next: NextFunction) =>
    void userController.fetchById(req, res, next),
);

router.delete(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN]),
  (req: Request, res: Response, next: NextFunction) =>
    void userController.deleteById(req, res, next),
);

router.patch(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN]),
  updateUserValidator,
  (req: Request, res: Response, next: NextFunction) =>
    void userController.updateById(req as UpdateUserRequest, res, next),
);

export default router;
