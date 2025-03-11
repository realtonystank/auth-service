import request from "supertest";
import app from "../..//app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../entity/User";
import { Roles } from "../../constants";
import createJWKSMock from "mock-jwks";
describe("POST /users", () => {
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
  });
  afterEach(() => {
    jwks.stop();
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should persist the user in db", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        tenantId: 1,
      };

      await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(userInDB).toHaveLength(1);

      expect(userInDB[0].email).toBe(userData.email);
    });
    it("should create a manager user", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        tenantId: 1,
      };

      await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(userInDB).toHaveLength(1);
      expect(userInDB[0].role).toBe(Roles.MANAGER);
      expect(userInDB[0].email).toBe(userData.email);
    });
    it("should return 403 if non admin user tries to create a user", async () => {
      const customerToken = jwks.token({
        sub: "1",
        role: Roles.CUSTOMER,
      });

      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
        tenantId: 1,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${customerToken}`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(response.statusCode).toBe(403);
      expect(userInDB).toHaveLength(0);
    });
  });
  describe("Some fields are missing", () => {
    it("should return 400 status code if tenantId is missing", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret12345",
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(response.statusCode).toBe(400);
      expect(userInDB).toHaveLength(0);
    });
  });
  describe("Fields are not in proper format", () => {
    it("should return 400 status code if password is too small", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "admin@gmail.com",
        password: "secret",
        tenantId: 1,
      };

      const response = await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);

      const userRepository = connection.getRepository(User);
      const userInDB = await userRepository.find();
      expect(response.statusCode).toBe(400);
      expect(userInDB).toHaveLength(0);
    });
  });
});
