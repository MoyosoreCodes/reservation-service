import { injectable } from "tsyringe";
import { FindManyOptions, ILike, IsNull, Repository } from "typeorm";

import { CreateRestaurantDto } from "../common/dto/restaurant.dto";
import { ContentNotFoundError } from "../common/errors";
import { PaginationDto } from "../common/pagination";
import { duplicateErrorHandler } from "../common/utils/database.utils";
import { dataSource } from "../config/database.config";
import { Restaurant } from "../entities/restaurant.entity";

@injectable()
export class RestaurantService {
  private readonly _restaurantRepository: Repository<Restaurant>;
  constructor() {
    this._restaurantRepository = dataSource.getRepository(Restaurant);
  }

  async create(dto: CreateRestaurantDto) {
    const restaurant = this._restaurantRepository.create({
      name: dto.name,
      operatingHours: dto.businessHours,
    });
    try {
      await this._restaurantRepository.save(restaurant);
      return this.findById(restaurant.id);
    } catch (error) {
      duplicateErrorHandler(error);
    }
  }

  async findAll(dto: PaginationDto) {
    const { page, search, size } = dto;

    const where: FindManyOptions<Restaurant>["where"] = {
      deletedAt: IsNull(),
    };

    if (search) where.name = ILike(`%${search}%`);

    const [data, count] = await this._restaurantRepository.findAndCount({
      where,
      take: size,
      skip: (page - 1) * size,
    });

    return {
      data,
      count,
    };
  }

  async findById(id: string) {
    const restaurant = await this._restaurantRepository.findOne({
      where: { id },
      relations: ["tables"],
    });

    if (!restaurant)
      throw new ContentNotFoundError(`Restaurant ${id} not found`);

    return restaurant!;
  }
}
