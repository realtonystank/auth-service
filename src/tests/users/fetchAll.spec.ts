import request from "supertest";
import app from "../..//app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Roles } from "../../constants";
import createJWKSMock from "mock-jwks";
import { User } from "../../entity/User";
import { createTenant } from "../../utils";
import { Tenant } from "../../entity/Tenant";
import { UserData } from "../../types";
describe("GET /users", () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  const users: UserData[] = [
    {
      firstName: "Priyansh",
      lastName: "Singh Rajwar",
      email: "admin@gmail.com",
      password: "secret12345",
      role: Roles.MANAGER,
      tenantId: undefined,
    },
    {
      firstName: "Test",
      lastName: "User",
      email: "admin2@gmail.com",
      password: "secret12345",
      role: Roles.ADMIN,
      tenantId: undefined,
    },
  ];
  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");
    connection = await AppDataSource.initialize();
  });
  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();

    const tenant = await createTenant(connection.getRepository(Tenant));
    for (const user of users) {
      user.tenantId = tenant.id;
    }
    const userRepository = connection.getRepository(User);
    await userRepository.save(users);
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
      expect(response.body.data).toHaveLength(users.length);
      expect(response.body.data[0]).toHaveProperty("role");
      expect(response.body.data[0].role).toBe(users[users.length - 1].role);
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
    it("should handle url query params", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });
      const response = await request(app)
        .get("/users?q=Priyansh&role=manager")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe("admin@gmail.com");
    });
    it("should not match any record because of query params", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });
      const response = await request(app)
        .get("/users?q=Priyansh&role=admin")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveLength(0);
    });
    it("should return only 1 record because of query params", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });
      const response = await request(app)
        .get("/users?perPage=1&currentPage=1")
        .set("Cookie", [`accessToken=${adminToken}`]);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveLength(1);
    });
  });
});
