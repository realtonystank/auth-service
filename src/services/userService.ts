import { UpdateUserData, UserData } from "../types";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";

export class UserService {
  constructor(private userRepository: Repository<User>) {}
  async create({
    firstName,
    lastName,
    email,
    password,
    role,
    tenantId,
  }: UserData) {
    const user = await this.userRepository.findOne({ where: { email: email } });
    if (user) {
      const error = createHttpError(400, "Email already exists");
      throw error;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
      const userInfo = await this.userRepository.save({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        tenant: tenantId ? { id: tenantId } : undefined,
      });
      return userInfo;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const error = createHttpError(
        500,
        "Failed to store the data in database",
      );
      throw error;
    }
  }
  async findByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: { email: email },
      select: ["id", "firstName", "lastName", "email", "role", "password"],
    });
  }
  async findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }
  async fetchAll() {
    return await this.userRepository.find();
  }
  async deleteById(id: number) {
    return await this.userRepository.delete({ id });
  }
  async updateById(
    id: number,
    { firstName, lastName, email, role, tenantId }: UpdateUserData,
  ) {
    return await this.userRepository.update(
      { id },
      {
        firstName,
        lastName,
        email,
        role,
        tenant: tenantId ? { id: tenantId } : undefined,
      },
    );
  }
}
