import { UserData } from "../types";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";

export class UserService {
  constructor(private userRepository: Repository<User>) {}
  async create({ firstName, lastName, email, password, role }: UserData) {
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
}
