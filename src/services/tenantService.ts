import { Repository } from "typeorm";
import { Tenant } from "../entity/Tenant";
import { IQueryParams, ITenant } from "../types";

export class TenantService {
  constructor(private readonly tenantRepository: Repository<Tenant>) {}

  async create(tenantData: ITenant) {
    return await this.tenantRepository.save(tenantData);
  }

  async getAll({ currentPage, perPage }: IQueryParams) {
    const queryBuilder = this.tenantRepository.createQueryBuilder();
    const tenants = await queryBuilder
      .skip((currentPage - 1) * perPage)
      .take(perPage)
      .getManyAndCount();
    return tenants;
  }
  async getById(id: number) {
    return await this.tenantRepository.findOne({
      where: { id },
    });
  }

  async deleteById(id: number) {
    return await this.tenantRepository.delete({ id });
  }

  async updateById(
    id: number,
    { name, address }: { name: string; address: string },
  ) {
    const patchData: Partial<ITenant> = {};
    if (name !== "") patchData.name = name;
    if (address !== "") patchData.address = address;
    return await this.tenantRepository.update(
      {
        id,
      },
      patchData,
    );
  }
}
