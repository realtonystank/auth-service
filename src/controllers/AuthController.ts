import { NextFunction, Response } from "express";

import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/userService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload } from "jsonwebtoken";
import { TokenService } from "../services/tokenService";
import { CredentialService } from "../services/credentialService";
import createHttpError from "http-errors";
import { Roles } from "../constants";

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentialService: CredentialService,
  ) {}
  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { firstName, lastName, email, password } = req.body;
    this.logger.debug("New request to register a user", {
      firstName,
      lastName,
      email,
      password: "*****",
    });
    try {
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
        role: Roles.CUSTOMER,
      });
      this.logger.info("User has been registerd", { id: user.id });

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
      });

      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: newRefreshToken.id,
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
      });

      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { email, password } = req.body;
    this.logger.debug("New request to register a user", {
      email,
      password: "*****",
    });
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        const error = createHttpError(400, "Email or password does not match");
        next(error);
        return;
      }

      const passwordMatch = this.credentialService.comparePassword(
        password,
        user.password,
      );

      if (!passwordMatch) {
        const error = createHttpError(400, "Email or password does not match");
        next(error);
        return;
      }

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
      });

      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: newRefreshToken.id,
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
      });

      this.logger.info("User has been logged in", {
        id: user.id,
      });

      res.status(200).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
  async self(req: AuthRequest, res: Response) {
    const user = await this.userService.findById(Number(req.auth.sub));
    res.json({ ...user, password: undefined });
  }
  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.findById(Number(req.auth.sub));
      if (!user) {
        const error = createHttpError(
          401,
          "Cannot find user associated with token",
        );
        next(error);
        return;
      }

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
      });

      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      await this.tokenService.deleteRefreshToken(req.auth.id);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: newRefreshToken.id,
      });

      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
      });

      this.logger.info("User has been refreshed with new tokens", {
        id: user.id,
      });

      res.status(200).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await this.tokenService.deleteRefreshToken(req.auth.id);
      this.logger.info("Refresh token has been deleted ", { id: req.auth.id });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      this.logger.info("Logging out user ", { id: req.auth.sub });
      res.json();
    } catch (err) {
      next(err);
      return;
    }
  }
}
