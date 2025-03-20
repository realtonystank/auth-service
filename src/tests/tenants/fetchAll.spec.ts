import request from "supertest";
import app from "../../app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Tenant } from "../../entity/Tenant";

describe("GET /tenants", () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });
  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();

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

  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get("/tenants").send();
      expect(response.statusCode).toBe(200);
    });
    it("should return correct json response", async () => {
      const response = await request(app).get("/tenants").send();
      expect(response.body).toHaveProperty("currentPage");
      expect(response.body.currentPage).toBe(1);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty("address");
      expect(response.body.data[0].address).toBe("test address 1");
    });
  });
});
