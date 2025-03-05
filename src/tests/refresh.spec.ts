import request from "supertest";
import app from "../app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { MS_IN_7DAY, Roles } from "../constants";
import { RefreshToken } from "../entity/RefreshToken";
import jwt from "jsonwebtoken";
import { Config } from "../config";
import { Headers } from "../types";
import createJWKSMock from "mock-jwks";
describe("POST /auth/register", () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");
    connection = await AppDataSource.initialize();
  });
  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();
  });
  afterEach(() => {
    jwks.stop();
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200 status code when valid refresh token is used", async () => {
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        role: "customer",
      });
      const refreshTokenRepo = connection.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepo.save({
        user: user,
        expiresAt: new Date(Date.now() + MS_IN_7DAY),
      });
      const refreshToken = jwt.sign(
        {
          sub: String(user.id),
          role: Roles.CUSTOMER,
          id: newRefreshToken.id,
        },
        Config.REFRESH_TOKEN_SECRET!,
        { algorithm: "HS256" },
      );
      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [`refreshToken=${refreshToken};`])
        .send();
      expect(response.statusCode).toBe(200);
    });
    it("should give new access and refresh token in cookie", async () => {
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        role: "customer",
      });
      const refreshTokenRepo = connection.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepo.save({
        user: user,
        expiresAt: new Date(Date.now() + MS_IN_7DAY),
      });
      const refreshToken = jwt.sign(
        {
          sub: String(user.id),
          role: Roles.CUSTOMER,
          id: newRefreshToken.id,
        },
        Config.REFRESH_TOKEN_SECRET!,
        { algorithm: "HS256" },
      );

      const accessToken = jwks.token({
        sub: String(user.id),
        role: user.role,
      });

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [
          `refreshToken=${refreshToken};accessToken=${accessToken};`,
        ])
        .send();
      let accessTokenFromCookie: string | null = null;
      let refreshTokenFromCookie: string | null = null;
      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];
      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          accessTokenFromCookie = cookie.split(";")[0].split("=")[1];
        }
        if (cookie.startsWith("refreshToken=")) {
          refreshTokenFromCookie = cookie.split(";")[0].split("=")[1];
        }
      });

      expect(accessTokenFromCookie).not.toBe(null);
      expect(accessTokenFromCookie).not.toEqual(accessToken);
      expect(refreshTokenFromCookie).not.toBe(null);
      expect(refreshTokenFromCookie).not.toEqual(refreshToken);
    });
    it("should delete old refresh token from cookie", async () => {
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        role: "customer",
      });
      const refreshTokenRepo = connection.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepo.save({
        user: user,
        expiresAt: new Date(Date.now() + MS_IN_7DAY),
      });
      const refreshToken = jwt.sign(
        {
          sub: String(user.id),
          role: Roles.CUSTOMER,
          id: newRefreshToken.id,
        },
        Config.REFRESH_TOKEN_SECRET!,
        { algorithm: "HS256" },
      );

      const accessToken = jwks.token({
        sub: String(user.id),
        role: user.role,
      });

      await request(app)
        .post("/auth/refresh")
        .set("Cookie", [
          `refreshToken=${refreshToken};accessToken=${accessToken};`,
        ])
        .send();

      const oldRefreshToken = await refreshTokenRepo.findOne({
        where: {
          id: newRefreshToken.id,
          user: { id: user.id },
        },
      });

      expect(oldRefreshToken).toBe(null);
    });
  });
  describe("Some fields are missing", () => {
    it("should return 401 status code when invalid refresh token is used", async () => {
      const refreshToken = jwt.sign(
        {
          sub: "1",
          role: Roles.CUSTOMER,
          id: "1",
        },
        Config.REFRESH_TOKEN_SECRET!,
        { algorithm: "HS256" },
      );
      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [`refreshToken=${refreshToken}`])
        .send();
      expect(response.statusCode).toBe(401);
    });
  });
});
