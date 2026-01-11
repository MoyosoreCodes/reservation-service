import { Between, IsNull, LessThanOrEqual, Not, Repository } from "typeorm";

import {
  CreateTableDTO,
  GetAvailableSlotsDTO,
  IsTableAvailableDTO,
} from "../common/dto/table.dto";
import { ReservationStatus } from "../common/enum/reservation.enum";
import { ClientError, ContentNotFoundError } from "../common/errors";
import { PaginationDto } from "../common/pagination";
import {
  getNextDateForDay,
  groupBy,
  hasTimeRangeOverlap,
  parseTimeToDate,
} from "../common/utils";
import { RedisCache } from "../common/utils/redis.util";
import { dataSource } from "../config/database.config";
import { Reservation } from "../entities/reservation.entity";
import { Restaurant } from "../entities/restaurant.entity";
import { Table } from "../entities/table.entity";

export class TableService {
  private readonly _tableRepository: Repository<Table>;
  private readonly _reservationRepository: Repository<Reservation>;

  constructor() {
    this._tableRepository = dataSource.getRepository(Table);
    this._reservationRepository = dataSource.getRepository(Reservation);
  }

  async create(
    dto: Omit<CreateTableDTO, "restaurantId">,
    restaurant: Restaurant,
  ) {
    const latestTable = await this._tableRepository.findOne({
      where: { restaurant: { id: restaurant.id } },
      order: { tableNumber: "DESC" },
    });

    const nextTableNumber = latestTable ? latestTable.tableNumber + 1 : 1;

    const table = this._tableRepository.create({
      ...dto,
      tableNumber: nextTableNumber,
      restaurant,
    });
    await this._tableRepository.save(table);

    return this.findById(table.id);
  }

  async findById(id: string) {
    const table = await this._tableRepository.findOne({
      where: { id },
      relations: ["restaurant"],
    });
    if (!table) throw new ContentNotFoundError(`Table: ${id} not found`);

    return table;
  }

  async isTableAvailable(dto: IsTableAvailableDTO) {
    const { id, day, duration, time } = dto;

    const reservationTime = getNextDateForDay(day, time);
    if (reservationTime === -1) throw new ClientError(`Invalid day: ${day}`);

    const proposedEndTime = new Date(
      reservationTime.getTime() + duration * 60000,
    );

    const potentialConflicts = await this._reservationRepository.find({
      where: {
        table: { id },
        time: LessThanOrEqual(proposedEndTime),
        deletedAt: IsNull(),
        status: Not(ReservationStatus.CANCELLED),
      },
    });

    const hasOverlap = potentialConflicts.some((existing) => {
      const existingEndTime = new Date(
        existing.time.getTime() + existing.duration * 60000,
      );
      return hasTimeRangeOverlap(
        reservationTime,
        proposedEndTime,
        existing.time,
        existingEndTime,
      );
    });

    return !hasOverlap;
  }

  async getAvailableTimeSlots(
    restaurant: Restaurant,
    dto: GetAvailableSlotsDTO,
  ) {
    const { size: partySize, duration } = dto;
    const startDate = dto.startDate ?? new Date().toISOString().split("T")[0];
    const endDate =
      dto.endDate ??
      (() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split("T")[0];
      })();

    const cacheKey = `available_slots:${restaurant.id}:${startDate}:${endDate}:${partySize}:${duration}`;

    const cached = await RedisCache.get<Record<string, string[]>>(cacheKey);
    if (cached) return cached;

    const slots = await this.computeAvailableSlots(
      restaurant,
      startDate,
      endDate,
      partySize,
      duration,
    );

    if (Object.keys(slots).length > 0) {
      await RedisCache.set(cacheKey, slots, 300);
    }

    return slots;
  }

  private async computeAvailableSlots(
    restaurant: Restaurant,
    startDate: string,
    endDate: string,
    partySize: number,
    duration: number,
  ) {
    const suitableTables = restaurant.tables.filter(
      (t) => t.capacity >= partySize,
    );

    if (suitableTables.length === 0)
      throw new ClientError("No suitable reservations found");

    const reservations = await this.getReservationsInRange(
      restaurant.id,
      startDate,
      endDate,
    );

    const slotsByDate: Record<string, string[]> = {};
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      const operatingHours =
        restaurant.operatingHours[
          dayOfWeek as keyof typeof restaurant.operatingHours
        ];

      if (operatingHours) {
        const dayReservations = reservations.filter((r) => {
          const resDate = r.time.toISOString().split("T")[0];
          return resDate === dateStr;
        });

        const reservationsByTable = groupBy(dayReservations, (r) => r.table.id);
        const openingTime = parseTimeToDate(dateStr, operatingHours.startTime);
        const closingTime = parseTimeToDate(dateStr, operatingHours.endTime);

        const slots = this.generateAvailableSlots(
          openingTime,
          closingTime,
          duration,
          suitableTables,
          reservationsByTable,
        );

        if (slots.length > 0) {
          slotsByDate[dateStr] = slots;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slotsByDate;
  }

  private async getReservationsInRange(
    restaurantId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this._reservationRepository.find({
      where: {
        table: { restaurant: { id: restaurantId } },
        time: Between(start, end),
        deletedAt: IsNull(),
        status: Not(ReservationStatus.CANCELLED), // Filter out cancelled reservations
      },
      relations: ["table"],
    });
  }

  generateAvailableSlots(
    openingTime: Date,
    closingTime: Date,
    duration: number,
    suitableTables: Table[],
    reservationsByTable: Record<string, Reservation[]>,
  ) {
    const availableSlots: string[] = [];
    const intervalMinutes = duration;
    const durationMs = duration * 60000;
    let currentSlot = new Date(openingTime);

    while (currentSlot.getTime() + durationMs <= closingTime.getTime()) {
      const slotEnd = new Date(currentSlot.getTime() + durationMs);

      const hasAvailableTable = suitableTables.some((table) => {
        const tableReservations = reservationsByTable[table.id] || [];
        return !tableReservations.some((reservation) => {
          const reservationEnd = new Date(
            reservation.time.getTime() + reservation.duration * 60000,
          );
          return hasTimeRangeOverlap(
            currentSlot,
            slotEnd,
            reservation.time,
            reservationEnd,
          );
        });
      });

      if (hasAvailableTable) {
        availableSlots.push(
          currentSlot.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        );
      }

      currentSlot = new Date(currentSlot.getTime() + intervalMinutes * 60000);
    }

    return availableSlots;
  }

  async findAllByRestaurant(restaurantId: string, pagination: PaginationDto) {
    const [data, total] = await this._tableRepository.findAndCount({
      where: { restaurant: { id: restaurantId } },
      select: { restaurant: true },
      relations: ["restaurant"],
      skip: (pagination.page - 1) * pagination.size,
      take: pagination.size,
    });
    return { data, total };
  }
}
