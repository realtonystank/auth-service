import { UpdateUserData, UserData, IQueryParams } from "../types";
import { User } from "../entity/User";
import { Brackets, Repository } from "typeorm";
import createHttpError from "http-errors";
import bcrypt from "bcryptjs";

export class UserService {
  constructor(private readonly userRepository: Repository<User>) {}
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
    return this.userRepository.findOne({
      where: { id },
      relations: { tenant: true },
    });
  }
  async fetchAll({ currentPage, perPage, q, role }: IQueryParams) {
    const queryBuilder = this.userRepository.createQueryBuilder("user");
    if (q) {
      const searchTerm = `%${q}%`;
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where("CONCAT (user.firstName, ' ', user.lastName) ILike :q ", {
            q: searchTerm,
          }).orWhere("user.email ILike :q", { q: searchTerm });
        }),
      );
    }
    if (role) {
      queryBuilder.andWhere("user.role = :role", { role: role });
    }
    const result = await queryBuilder
      .skip((currentPage - 1) * perPage)
      .take(perPage)
      .orderBy("user.id", "DESC")
      .getManyAndCount();
    return result;
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
