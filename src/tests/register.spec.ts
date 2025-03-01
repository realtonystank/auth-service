import request from "supertest";
import app from "../app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { truncateTables } from "../utils";
import { User } from "../entity/User";
describe("POST /auth/register", () => {
  let connection: DataSource;
  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });
  beforeEach(async () => {
    await truncateTables(connection);
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
        password: "secret",
      };
      const response = await request(app).post("/auth/register").send(userData);

      expect(response.statusCode).toBe(201);
    });
    it("should return valid json response", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret",
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
        password: "secret",
      };

      await request(app).post("/auth/register").send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users.length).toBe(1);
      expect(users[0].firstName).toBe(userData.firstName);
      expect(users[0].lastName).toBe(userData.lastName);
    });
  });
  describe("Some fields are missing", () => {});
});
