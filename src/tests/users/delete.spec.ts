import request from "supertest";
import app from "../..//app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../entity/User";
import { Roles } from "../../constants";
import createJWKSMock from "mock-jwks";
import { createTenant } from "../../utils";
import { Tenant } from "../../entity/Tenant";
describe("POST /users", () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  let adminToken: string;
  let customerToken: string;
  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");
    connection = await AppDataSource.initialize();
  });
  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();
    adminToken = jwks.token({
      sub: "1",
      role: Roles.ADMIN,
    });
    customerToken = jwks.token({
      sub: "1",
      role: Roles.CUSTOMER,
    });
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
      const response = await request(app)
        .delete("/users/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      expect(response.statusCode).toBe(200);
    });
    it("should delete user from db", async () => {
      await request(app)
        .delete("/users/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(userInDB).toHaveLength(0);
    });
    it("should return 403 if non admin user tries to delete a user", async () => {
      const response = await request(app)
        .delete("/users/1")
        .set("Cookie", [`accessToken=${customerToken}`])
        .send();

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(response.statusCode).toBe(403);
      expect(userInDB).toHaveLength(1);
    });
  });
  describe("Some fields are missing", () => {});
  describe("Fields are not in proper format", () => {});
});
