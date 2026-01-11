import { injectable } from "tsyringe";

import {
  AddTableToRestaurantDto,
  CreateRestaurantDto,
  GetRestaurantByIdDto,
} from "../common/dto/restaurant.dto";
import { PaginationDto } from "../common/pagination";
import { ReservationService } from "../services/reservation.service";
import { RestaurantService } from "../services/restaurant.service";
import { TableService } from "../services/table.service";

@injectable()
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly tableService: TableService,
    private readonly reservationService: ReservationService,
  ) {}

  async create(dto: CreateRestaurantDto) {
    return await this.restaurantService.create(dto);
  }

  async findById(dto: GetRestaurantByIdDto) {
    const { id } = dto;
    return await this.restaurantService.findById(id);
  }

  async findAll(dto: PaginationDto) {
    return await this.restaurantService.findAll(dto);
  }

  async addTable(dto: AddTableToRestaurantDto) {
    const { restaurantId, capacity, tableNumber } = dto;
    const restaurant = await this.restaurantService.findById(restaurantId);

    return await this.tableService.create(
      {
        capacity,
        tableNumber,
      },
      restaurant,
    );
  }
}
