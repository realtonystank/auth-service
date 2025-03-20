import request from "supertest";
import app from "../..//app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Roles } from "../../constants";
import createJWKSMock from "mock-jwks";
import { User } from "../../entity/User";
import { createTenant } from "../../utils";
import { Tenant } from "../../entity/Tenant";
describe("GET /users", () => {
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

    const tenant = await createTenant(connection.getRepository(Tenant));
    const userRepository = connection.getRepository(User);
    await userRepository.save({
      firstName: "Priyansh",
      lastName: "Singh Rajwar",
      email: "admin@gmail.com",
      password: "secret12345",
      role: Roles.MANAGER,
      tenantId: tenant.id,
    });
  });
  afterEach(() => {
    jwks.stop();
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200 status code", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      const response = await request(app)
        .get("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      expect(response.statusCode).toBe(200);
    });
    it("should return 403 if non admin user tries to fetch all users", async () => {
      const customerToken = jwks.token({
        sub: "1",
        role: Roles.CUSTOMER,
      });

      const response = await request(app)
        .get("/users")
        .set("Cookie", [`accessToken=${customerToken}`])
        .send();

      expect(response.statusCode).toBe(403);
    });
    it("should return a valid json response", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      const response = await request(app)
        .get("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      expect(
        (response.headers as Record<string, string>)["content-type"],
      ).toEqual(expect.stringContaining("json"));

      expect(response.body).toHaveProperty("currentPage");
      expect(response.body.currentPage).toBe(1);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty("role");
      expect(response.body.data[0].role).toBe(Roles.MANAGER);
    });
    it("should not return password in response json", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      const response = await request(app)
        .get("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      expect(response.body).not.toBeNull();
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).not.toHaveLength(0);
      expect(response.body.data[0]).not.toHaveProperty("password");
    });
  });
});
