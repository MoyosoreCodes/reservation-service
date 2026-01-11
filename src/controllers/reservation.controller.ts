import { injectable } from "tsyringe";

import {
  CreateReservationDTO,
  GetAllReservationsDTO,
} from "../common/dto/reservation.dto";
import { ReservationService } from "../services/reservation.service";
import { TableService } from "../services/table.service";

@injectable()
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly tableService: TableService,
  ) {}

  async create(dto: CreateReservationDTO) {
    const { tableId } = dto;
    const table = await this.tableService.findById(tableId);

    return await this.reservationService.create(dto, table);
  }

  async findAll(restaurantId: string, dto: GetAllReservationsDTO) {
    return await this.reservationService.findAll(restaurantId, dto);
  }
}
