import request from "supertest";
import app from "../../app";
import { DataSource } from "typeorm";
import createJWKSMock from "mock-jwks";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../entity/User";
import { Roles } from "../../constants";
describe("POST /auth/self", () => {
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
    it("should return 200 status code", async () => {
      const accessToken = jwks.token({
        sub: "1",
        role: Roles.CUSTOMER,
      });
      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();
      expect(response.statusCode).toBe(200);
    });
    it("should return the user data", async () => {
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        role: "customer",
      });

      const accessToken = jwks.token({
        sub: String(user.id),
        role: user.role,
      });

      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect((response.body as Record<string, string>).id).toBe(user.id);
    });
    it("should not return password field", async () => {
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        role: "customer",
      });

      const accessToken = jwks.token({
        sub: String(user.id),
        role: user.role,
      });

      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      expect(response.body).not.toHaveProperty("password");
    });
  });
  describe("Some fields are missing", () => {
    it("should return 401 status code if token does not exist", async () => {
      const response = await request(app).get("/auth/self").send();

      expect(response.statusCode).toBe(401);
    });
  });
});
