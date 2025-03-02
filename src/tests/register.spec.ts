import request from "supertest";
import app from "../app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { Roles } from "../constants";
import { isJwt } from "../utils";
describe("POST /auth/register", () => {
  let connection: DataSource;
  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });
  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return 201 status code", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };
      const response = await request(app).post("/auth/register").send(userData);

      expect(response.statusCode).toBe(201);
    });
    it("should return valid json response", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(
        (response.headers as Record<string, string>)["content-type"],
      ).toEqual(expect.stringContaining("json"));
    });
    it("should persist the user in the database", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      await request(app).post("/auth/register").send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users.length).toBe(1);
      expect(users[0].firstName).toBe(userData.firstName);
      expect(users[0].lastName).toBe(userData.lastName);
    });
    it("should return id of the created user", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(response.body).toHaveProperty("id");
    });
    it("should assign a customer role", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0]).toHaveProperty("role");
      expect(users[0].role).toBe(Roles.CUSTOMER);
    });
    it("should store the hashed password in the database", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      await request(app).post("/auth/register").send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
    });
    it("should return 400 status code if email already exists", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };
      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: Roles.CUSTOMER });

      const response = await request(app).post("/auth/register").send(userData);

      const users = await userRepository.find();

      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });
    it("should return the access token and refresh token inside a cookie", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/register").send(userData);

      interface Headers {
        ["set-cookie"]: string[];
      }

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
  });
  describe("Some fields are missing", () => {
    it("should return 400 status code if email field is missing", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "",
        password: "secret12345",
      };
      const response = await request(app).post("/auth/register").send(userData);

      expect(response.statusCode).toBe(400);
    });
  });
  describe("Fields are not in proper format", () => {
    it("should trim the email field", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: " rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      const user = users[0];
      expect(user.email).toBe(userData.email.trim());
    });
    it("should return 400 status code if email is missing", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(response.statusCode).toBe(400);
    });
    it("should return 400 status code if email is not valid", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: " rajwars.priyansh.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(response.statusCode).toBe(400);
    });
    it("should return 400 status code if firstName is missing", async () => {
      const userData = {
        firstName: "",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
    });
    it("should return 400 status code if lastName is missing", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "",
        email: "rajwars.priyansh@gmail.com",
        password: "secret12345",
      };

      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
    });
    it("should return 400 status code if password is missing", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "",
      };

      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
    });
    it("should return 400 status code if password length is less than 8 characters", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "abcd",
      };

      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
    });
  });
});
