import request from "supertest";
import app from "../app";
describe("POST /auth/register", () => {
  describe("Given all fields", () => {
    it("should return 201 status code", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret",
      };
      const response = await request(app).post("/auth/register").send(userData);

      expect(response.statusCode).toBe(201);
    });
    it("should return valid json response", async () => {
      const userData = {
        firstName: "Priyansh",
        lastName: "Singh Rajwar",
        email: "rajwars.priyansh@gmail.com",
        password: "secret",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(
        (response.headers as Record<string, string>)["content-type"],
      ).toEqual(expect.stringContaining("json"));
    });
  });
  describe("Some fields are missing", () => {});
});
