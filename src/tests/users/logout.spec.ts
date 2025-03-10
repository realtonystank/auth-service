import request from "supertest";
import app from "../../app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../entity/User";
import { MS_IN_7DAY, Roles } from "../../constants";
import { RefreshToken } from "../../entity/RefreshToken";
import jwt from "jsonwebtoken";
import { Config } from "../../config";
import createJWKSMock from "mock-jwks";
import { Headers } from "../../types";
describe("POST /auth/logout", () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  beforeAll(async () => {
    connection = await AppDataSource.initialize();
    jwks = createJWKSMock("http://localhost:5501");
  });
  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });
  afterAll(async () => {
    await connection.destroy();
  });
  afterEach(() => {
    jwks.stop();
  });

  describe("Given all fields", () => {
    it("should return 200 status code", async () => {
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        role: Roles.CUSTOMER,
      });

      const refreshTokenRepository = connection.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepository.save({
        user,
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
        .post("/auth/logout")
        .set("Cookie", [`refreshToken=${refreshToken}`])
        .send();

      expect(response.statusCode).toBe(200);
    });
    it("should clear access and refresh token from cookies", async () => {
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        role: Roles.CUSTOMER,
      });

      const refreshTokenRepository = connection.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepository.save({
        user,
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
        role: Roles.CUSTOMER,
      });

      const response = await request(app)
        .post("/auth/logout")
        .set("Cookie", [
          `accessToken=${accessToken};refreshToken=${refreshToken};`,
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
      expect(accessTokenFromCookie).toBe("");
      expect(refreshTokenFromCookie).toBe("");
    });
    it("should delete refresh token from database", async () => {
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        role: Roles.CUSTOMER,
      });

      const refreshTokenRepository = connection.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepository.save({
        user,
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
        role: Roles.CUSTOMER,
      });

      await request(app)
        .post("/auth/logout")
        .set("Cookie", [
          `accessToken=${accessToken};refreshToken=${refreshToken};`,
        ])
        .send();

      const refreshTokenFromDB = await refreshTokenRepository.findOne({
        where: { id: newRefreshToken.id, user: user },
      });

      expect(refreshTokenFromDB).toBeNull();
    });
  });
  describe("Some fields are missing", () => {
    it("should return 401 status code when user is not logged in", async () => {
      const response = await request(app).post("/auth/logout").send();

      expect(response.statusCode).toBe(401);
    });
  });
});
