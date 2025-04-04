import { Repository } from "typeorm";
import { Tenant } from "../entity/Tenant";

export const isJwt = (token: string | null): boolean => {
  if (token === null) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    parts.forEach((part) => {
      Buffer.from(part, "base64").toString("utf-8");
    });
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    return false;
  }
};

export const createTenant = async (repository: Repository<Tenant>) => {
  const tenant = await repository.save({
    name: "Test tenant",
    address: "Test address",
  });
  return tenant;
};
