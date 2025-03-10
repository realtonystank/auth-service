import request from "supertest";
import app from "../../app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Tenant } from "../../entity/Tenant";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../constants";
describe("GET /tenants/:id", () => {
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
    it("should return 200 status code", async () => {
      const response = await request(app)
        .get("/tenants/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      expect(response.statusCode).toBe(200);
    });
    it("should return correct json response", async () => {
      const response = await request(app)
        .get("/tenants/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();

      expect(response.body.name).toBe("test name 1");
      expect(response.body.address).toBe("test address 1");
    });
    it("should return 401 status code if not authenticated", async () => {
      const response = await request(app).get("/tenants/1").send();

      expect(response.statusCode).toBe(401);
      expect(response.body).not.toHaveProperty("name");
      expect(response.body).not.toHaveProperty("address");
    });
    it("should return 403 status code if user is customer", async () => {
      const response = await request(app)
        .get("/tenants/1")
        .set("Cookie", [`accessToken=${customerToken}`])
        .send();

      expect(response.statusCode).toBe(403);
      expect(response.body).not.toHaveProperty("name");
      expect(response.body).not.toHaveProperty("address");
    });
  });
});
