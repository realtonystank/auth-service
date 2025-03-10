import request from "supertest";
import app from "../..//app";
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
  });
  afterEach(() => {
    jwks.stop();
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return 201 status code", async () => {
      const tenantData = {
        name: "test tenant",
        address: "tenant address",
      };

      const response = await request(app)
        .post("/tenants")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(tenantData);
      expect(response.statusCode).toBe(201);
    });
    it("should create tenant in the database", async () => {
      const tenantData = {
        name: "test tenant",
        address: "tenant address",
      };

      await request(app)
        .post("/tenants")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(tenantData);

      const tenantRepository = connection.getRepository(Tenant);
      const tenantInDb = await tenantRepository.find();

      expect(tenantInDb).not.toBeNull();
      expect(tenantInDb).toHaveLength(1);
      expect(tenantInDb[0].name).toBe(tenantData.name);
      expect(tenantInDb[0].address).toBe(tenantData.address);
    });
    it("should return 401 status if user is not authenticated", async () => {
      const tenantData = {
        name: "test tenant",
        address: "tenant address",
      };

      const response = await request(app).post("/tenants").send(tenantData);

      expect(response.statusCode).toBe(401);

      const tenantRepository = connection.getRepository(Tenant);
      const tenantInDb = await tenantRepository.find();
      expect(tenantInDb).toHaveLength(0);
    });
    it("should return 403 status if user is not admin", async () => {
      const tenantData = {
        name: "test tenant",
        address: "tenant address",
      };

      const response = await request(app)
        .post("/tenants")
        .set("Cookie", [`accessToken=${managerToken}`])
        .send(tenantData);

      expect(response.statusCode).toBe(403);

      const tenantRepository = connection.getRepository(Tenant);
      const tenantInDb = await tenantRepository.find();
      expect(tenantInDb).toHaveLength(0);
    });
  });
  describe("Fields are missing", () => {
    it("should return 400 status if tenant name is empty", async () => {
      const tenantData = {
        name: "",
        address: "test address",
      };

      const response = await request(app)
        .post("/tenants")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(tenantData);

      expect(response.statusCode).toBe(400);

      const tenantRepository = connection.getRepository(Tenant);
      const tenantInDb = await tenantRepository.find();
      expect(tenantInDb).toHaveLength(0);
    });
  });
});
