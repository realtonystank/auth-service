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
    it.todo("should return 403 if non admin user tries to create a user");
  });
  describe("Some fields are missing", () => {});
  describe("Fields are not in proper format", () => {});
});
