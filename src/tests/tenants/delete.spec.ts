import request from "supertest";
import app from "../../app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Tenant } from "../../entity/Tenant";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../constants";
describe("DELETE /tenants", () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  let adminToken: string;
  let customerToken: string;
  beforeAll(async () => {
    connection = await AppDataSource.initialize();
    jwks = createJWKSMock("http://localhost:5501");
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
      sub: "2",
      role: Roles.CUSTOMER,
    });

    const tenantRepository = connection.getRepository(Tenant);
    await tenantRepository.save([
      {
        name: "test name 1",
        address: "test address 1",
      },
      {
        name: "test name 2",
        address: "test address 2",
      },
    ]);
  });
  afterEach(() => {
    jwks.stop();
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200 status", async () => {
      const response = await request(app)
        .delete("/tenants/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();
      expect(response.statusCode).toBe(200);
    });
    it("should delete tenant from database", async () => {
      await request(app)
        .delete("/tenants/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      const tenantRepository = connection.getRepository(Tenant);
      const tenant = await tenantRepository.find();
      expect(tenant).toHaveLength(1);
    });
    it("should return 401 status when unauthenticated", async () => {
      const response = await request(app).delete("/tenants/1").send();
      expect(response.statusCode).toBe(401);
    });
    it("should return 403 status when user is not admin", async () => {
      const response = await request(app)
        .delete("/tenants/1")
        .set("Cookie", [`accessToken=${customerToken}`])
        .send();

      expect(response.statusCode).toBe(403);
    });
  });
});
