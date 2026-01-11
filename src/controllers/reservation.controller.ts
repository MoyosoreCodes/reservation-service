import { injectable } from "tsyringe";

import {
  CancelReservationDTO,
  CreateReservationDTO,
  GetAllReservationsDTO,
  UpdateReservationDTO,
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

  async cancel(dto: CancelReservationDTO) {
    return await this.reservationService.cancelReservation(dto.id);
  }

  async update(dto: UpdateReservationDTO) {
    const { id, tableId, ...updates } = dto;

    const existingReservation = await this.reservationService.findById(id);

    let table;
    if (tableId && existingReservation.table.id !== tableId) {
      table = await this.tableService.findById(tableId);
    }

    return await this.reservationService.update(id, updates, table);
  }
}
