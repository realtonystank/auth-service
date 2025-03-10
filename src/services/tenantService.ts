import { Repository } from "typeorm";
import { Tenant } from "../entity/Tenant";
import { ITenant } from "../types";

export class TenantService {
  constructor(private tenantRepository: Repository<Tenant>) {}

  async create(tenantData: ITenant) {
    return await this.tenantRepository.save(tenantData);
  }

  async getAll() {
    return await this.tenantRepository.find();
  }
  async getById(id: number) {
    return await this.tenantRepository.findOne({
      where: { id },
    });
  }

  async deleteById(id: number) {
    return await this.tenantRepository.delete({ id });
  }
}
