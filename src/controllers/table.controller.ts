import { injectable } from "tsyringe";

import {
  CreateTableDTO,
  GetAvailableSlotsDTO,
  GetTablesByRestaurantIdParams,
  IsTableAvailableDTO,
} from "../common/dto/table.dto";
import { ReservationService } from "../services/reservation.service";
import { RestaurantService } from "../services/restaurant.service";
import { TableService } from "../services/table.service";

@injectable()
export class TableController {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly tableService: TableService,
    private readonly reservationService: ReservationService,
  ) {}

  async create(dto: CreateTableDTO) {
    const { capacity, restaurantId } = dto;

    const restaurant = await this.restaurantService.findById(restaurantId);

    const table = await this.tableService.create({ capacity }, restaurant);

    return table;
  }

  async isAvailable(dto: IsTableAvailableDTO) {
    await this.tableService.findById(dto.id);
    return await this.tableService.isTableAvailable(dto);
  }

  async getAvailableSlots(dto: GetAvailableSlotsDTO) {
    const { restaurantId } = dto;
    const restaurant = await this.restaurantService.findById(restaurantId);
    return await this.tableService.getAvailableTimeSlots(restaurant, dto);
  }

  async getTablesByRestaurantId(dto: GetTablesByRestaurantIdParams) {
    const { restaurantId, ...pagination } = dto;
    await this.restaurantService.findById(restaurantId);
    return await this.tableService.findAllByRestaurant(
      restaurantId,
      pagination,
    );
  }
}
