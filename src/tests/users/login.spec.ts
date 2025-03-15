import request from "supertest";
import app from "../..//app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../entity/User";
import { Roles } from "../../constants";
import { isJwt } from "../../utils";
import { RefreshToken } from "../../entity/RefreshToken";
import { Headers } from "../../types";
import { hash } from "bcryptjs";
describe("POST /auth/login", () => {
  let connection: DataSource;
  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });
  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
    const userRepository = connection.getRepository(User);
    const hashedPassword = await hash("secret12345", 10);
    await userRepository.save({
      firstName: "Priyansh",
      lastName: "Singh Rajwar",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: Roles.CUSTOMER,
    });
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should login the user", async () => {
      const userData = {
        email: "admin@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(200);
    });
    it("should return valid json response", async () => {
      const userData = {
        email: "admin@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(
        (response.headers as Record<string, string>)["content-type"],
      ).toEqual(expect.stringContaining("json"));
    });
    it("should return id of the created user", async () => {
      const userData = {
        email: "admin@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.body).toHaveProperty("id");
    });
    it("should return the access token and refresh token inside a cookie", async () => {
      const userData = {
        email: "admin@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/login").send(userData);

      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];
      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          accessToken = cookie.split(";")[0].split("=")[1];
        }
        if (cookie.startsWith("refreshToken=")) {
          refreshToken = cookie.split(";")[0].split("=")[1];
        }
      });

      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();
      expect(isJwt(accessToken)).toBeTruthy();
      expect(isJwt(refreshToken)).toBeTruthy();
    });
    it("should store the refreshToken in database", async () => {
      const userData = {
        email: "admin@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/login").send(userData);

      const refreshTokenRepository = connection.getRepository(RefreshToken);

      const tokens = await refreshTokenRepository
        .createQueryBuilder("refreshToken")
        .where("refreshToken.userId = :userId", {
          userId: (response.body as Record<string, string>).id,
        })
        .getMany();

      expect(tokens).toHaveLength(1);
    });
    it("should return 400 status if wrong password is used", async () => {
      const userData = {
        email: "admin@gmail.com",
        password: "secret123456",
      };
      const response = await request(app).post("/auth/login").send(userData);
      expect(response.statusCode).toBe(400);
    });
  });
  describe("Some fields are missing", () => {
    it("should return 400 status code if email is missing", async () => {
      const userData = {
        email: "",
        password: "secret12345",
      };
      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(400);
    });
    it("should return 400 status code if password is missing", async () => {
      const userData = {
        email: "admin@gmail.com",
        password: "",
      };
      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(400);
    });
  });
  describe("Fields are not in proper format", () => {
    it("should trim the email field", async () => {
      const userData = {
        email: " admin@gmail.com",
        password: "secret12345",
      };

      await request(app).post("/auth/login").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      const user = users[0];
      expect(user.email).toBe(userData.email.trim());
    });
    it("should return 400 status code if email is not valid", async () => {
      const userData = {
        email: " admin.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/login").send(userData);

      expect(response.statusCode).toBe(400);
    });
  });
});
