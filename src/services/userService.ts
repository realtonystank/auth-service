import { UserData } from "../types";
import { User } from "../entity/User";
import { Repository } from "typeorm";
import createHttpError from "http-errors";

export class UserService {
  constructor(private userRepository: Repository<User>) {}
  async create({ firstName, lastName, email, password }: UserData) {
    try {
      const userInfo = await this.userRepository.save({
        firstName,
        lastName,
        email,
        password,
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
}
