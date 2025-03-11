import request from "supertest";
import app from "../../app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Tenant } from "../../entity/Tenant";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../constants";
describe("POST /tenants", () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  let adminToken: string;
  let managerToken: string;
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
    managerToken = jwks.token({
      sub: "2",
      role: Roles.MANAGER,
    });
    const tenantRepository = connection.getRepository(Tenant);
    await tenantRepository.save({
      name: "test name 1",
      address: "test address 1",
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
      const tenantPatch = {
        name: "test tenant",
      };

      const response = await request(app)
        .patch("/tenants/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(tenantPatch);
      expect(response.statusCode).toBe(200);
    });
    it("should update the tenant data in db", async () => {
      const tenantPatch = {
        name: "test tenant",
      };

      await request(app)
        .patch("/tenants/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(tenantPatch);

      const tenantRepository = connection.getRepository(Tenant);
      const tenantFromDB = await tenantRepository.find();
      expect(tenantFromDB).toHaveLength(1);
      expect(tenantFromDB[0].name).toBe("test tenant");
      expect(tenantFromDB[0].address).toBe("test address 1");
    });
    it("should return 401 status code when user is not authenticated", async () => {
      const tenantPatch = {
        name: "test tenant",
      };

      const response = await request(app).patch("/tenants/1").send(tenantPatch);

      const tenantRepository = connection.getRepository(Tenant);
      const tenantFromDB = await tenantRepository.find();

      expect(response.statusCode).toBe(401);
      expect(tenantFromDB).toHaveLength(1);
      expect(tenantFromDB[0].name).toBe("test name 1");
      expect(tenantFromDB[0].address).toBe("test address 1");
    });
    it("should return 403 status code when non-admin user tries to update", async () => {
      const tenantPatch = {
        name: "test tenant",
      };

      const response = await request(app)
        .patch("/tenants/1")
        .set("Cookie", [`accessToken=${managerToken}`])
        .send(tenantPatch);

      const tenantRepository = connection.getRepository(Tenant);
      const tenantFromDB = await tenantRepository.find();
      expect(response.statusCode).toBe(403);
      expect(tenantFromDB).toHaveLength(1);
      expect(tenantFromDB[0].name).toBe("test name 1");
      expect(tenantFromDB[0].address).toBe("test address 1");
    });
  });
});
