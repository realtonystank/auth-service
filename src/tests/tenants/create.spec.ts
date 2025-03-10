import request from "supertest";
import app from "../..//app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Tenant } from "../../entity/Tenant";
describe("POST /tenants", () => {
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
      const tenantData = {
        name: "test tenant",
        address: "tenant address",
      };

      const response = await request(app).post("/tenants").send(tenantData);
      expect(response.statusCode).toBe(201);
    });
    it("should create tenant in the database", async () => {
      const tenantData = {
        name: "test tenant",
        address: "tenant address",
      };

      await request(app).post("/tenants").send(tenantData);

      const tenantRepository = connection.getRepository(Tenant);
      const tenantInDb = await tenantRepository.find();

      expect(tenantInDb).not.toBeNull();
      expect(tenantInDb).toHaveLength(1);
      expect(tenantInDb[0].name).toBe(tenantData.name);
      expect(tenantInDb[0].address).toBe(tenantData.address);
    });
  });
  describe("Fields are not in proper format", () => {});
});
