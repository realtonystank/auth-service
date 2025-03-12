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
      firstName: "test",
      lastName: "user",
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
      const userPatch = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        role: Roles.MANAGER,
        tenantId: "1",
      };

      const response = await request(app)
        .patch("/users/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userPatch);

      expect(response.statusCode).toBe(200);
    });
    it("should update user in db", async () => {
      const userPatch = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        role: Roles.MANAGER,
        tenantId: "1",
      };

      await request(app)
        .patch("/users/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userPatch);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(userInDB).toHaveLength(1);
      expect(userInDB[0].firstName).toBe(userPatch.firstName);
      expect(userInDB[0].lastName).toBe(userPatch.lastName);
    });
    it("should return 401 status if not authenticated", async () => {
      const userPatch = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        role: Roles.MANAGER,
        tenantId: "1",
      };

      const response = await request(app).patch("/users/1").send(userPatch);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(response.statusCode).toBe(401);
      expect(userInDB).toHaveLength(1);
      expect(userInDB[0].firstName).toBe("test");
      expect(userInDB[0].lastName).toBe("user");
    });
    it("should return 403 status if non admin user tries to update a user", async () => {
      const userPatch = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        role: Roles.MANAGER,
        tenantId: "1",
      };

      const response = await request(app)
        .patch("/users/1")
        .set("Cookie", [`accessToken=${customerToken}`])
        .send(userPatch);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find({
        select: ["firstName", "lastName", "password"],
      });
      expect(response.statusCode).toBe(403);
      expect(userInDB).toHaveLength(1);
      expect(userInDB[0].firstName).toBe("test");
      expect(userInDB[0].lastName).toBe("user");
    });
    it("should not update password field of user", async () => {
      const userPatch = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        password: "password12345",
        email: "admin@gmail.com",
        role: Roles.MANAGER,
        tenantId: "1",
      };

      await request(app)
        .patch("/users/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userPatch);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find({
        select: ["firstName", "lastName", "password"],
      });
      expect(userInDB).toHaveLength(1);
      expect(userInDB[0].firstName).toBe("Priyansh");
      expect(userInDB[0].lastName).toBe("Singh Rajwar");
      expect(userInDB[0].password).toBe("secret12345");
    });
  });
  describe("Some fields are missing", () => {
    it("should return 400 status if email is missing", async () => {
      const userPatch = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        password: "password12345",
        role: Roles.MANAGER,
        tenantId: "1",
      };

      const response = await request(app)
        .patch("/users/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userPatch);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find({
        select: ["firstName", "lastName", "password"],
      });

      expect(response.statusCode).toBe(400);
      expect(userInDB).toHaveLength(1);
      expect(userInDB[0].firstName).toBe("test");
      expect(userInDB[0].lastName).toBe("user");
      expect(userInDB[0].password).toBe("secret12345");
    });
  });
  describe("Fields are not in proper format", () => {
    it("should return 400 status if email is not in proper format", async () => {
      const userPatch = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        password: "password12345",
        email: "admin.gmail.com",
        role: Roles.MANAGER,
        tenantId: "1",
      };

      const response = await request(app)
        .patch("/users/1")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userPatch);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find({
        select: ["firstName", "lastName", "password"],
      });
      expect(response.statusCode).toBe(400);
      expect(userInDB).toHaveLength(1);
      expect(userInDB[0].firstName).toBe("test");
      expect(userInDB[0].lastName).toBe("user");
      expect(userInDB[0].password).toBe("secret12345");
    });
  });
});
