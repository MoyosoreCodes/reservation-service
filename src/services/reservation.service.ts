import {
  Between,
  FindManyOptions,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";

import {
  CreateReservationDTO,
  GetAllReservationsDTO,
} from "../common/dto/reservation.dto";
import { GetAvailableSlotsDTO } from "../common/dto/table.dto";
import { ClientError, ContentNotFoundError } from "../common/errors";
import {
  duplicateErrorHandler,
  getNextDateForDay,
  getOperatingHoursForDate,
  groupBy,
  hasTimeRangeOverlap,
  parseTimeToDate,
  RedisCache,
} from "../common/utils";
import { dataSource } from "../config/database.config";
import { Reservation } from "../entities/reservation.entity";
import { Restaurant } from "../entities/restaurant.entity";
import { Table } from "../entities/table.entity";

export class ReservationService {
  private readonly _reservationRepository: Repository<Reservation>;

  constructor() {
    this._reservationRepository = dataSource.getRepository(Reservation);
  }

  async create(dto: CreateReservationDTO, table: Table) {
    const { day, time, duration, size, customerName, phone } = dto;

    const reservationTime = getNextDateForDay(day, time);
    if (reservationTime === -1) throw new ClientError(`Invalid day: ${day}`);

    const dayHours =
      table.restaurant.operatingHours[
        day as keyof typeof table.restaurant.operatingHours
      ];
    if (!dayHours) throw new ClientError(`Restaurant is closed on ${day}`);

    const openingTime = parseTimeToDate(
      (reservationTime as Date).toISOString().split("T")[0],
      dayHours.startTime
    );
    const closingTime = parseTimeToDate(
      (reservationTime as Date).toISOString().split("T")[0],
      dayHours.endTime
    );

    const isNotOperatingHours =
      reservationTime < openingTime || reservationTime > closingTime;

    if (isNotOperatingHours)
      throw new ClientError(
        "Reservation time is outside of restaurant operating hours"
      );

    if (size > table.capacity)
      throw new ClientError("Party size is larger than table capacity");

    const reservationEndTime = new Date(
      (reservationTime as Date).getTime() + duration * 60000
    );

    const potentialConflicts = await this._reservationRepository.find({
      where: {
        table: { id: table.id },
        time: LessThan(reservationEndTime),
        deletedAt: IsNull(),
      },
    });

    const hasOverlap = potentialConflicts.some((existing) => {
      const existingEndTime = new Date(
        existing.time.getTime() + existing.duration * 60000
      );
      return hasTimeRangeOverlap(
        reservationTime as Date,
        reservationEndTime,
        existing.time,
        existingEndTime
      );
    });

    if (hasOverlap)
      throw new ClientError(
        "Table is already reserved for the selected time slot"
      );

    const reservation = this._reservationRepository.create({
      customerName,
      phone,
      size,
      time: reservationTime as Date,
      duration,
      table,
    });

    try {
      const savedReservation =
        await this._reservationRepository.save(reservation);

      const reservationDate = (reservationTime as Date)
        .toISOString()
        .split("T")[0];
      await RedisCache.deletePattern(
        `available_slots:${table.restaurant.id}:${reservationDate}:*`
      );

      return savedReservation;
    } catch (error) {
      duplicateErrorHandler(error);
    }
  }

  async findById(id: string) {
    const reservation = await this._reservationRepository.findOne({
      where: { id },
      relations: ["table"],
    });

    if (!reservation)
      throw new ContentNotFoundError(`Restaurant ${id} not found`);

    return reservation;
  }

  async findAll(restaurantId: string, dto: GetAllReservationsDTO) {
    const { page, size } = dto;

    const startDate = dto.startDate || new Date().toISOString().split("T")[0];
    const endDate =
      dto.endDate ||
      (() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split("T")[0];
      })();

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [data, count] = await this._reservationRepository.findAndCount({
      where: {
        deletedAt: IsNull(),
        table: { restaurant: { id: restaurantId } },
        time: Between(start, end),
      },
      relations: ["table"],
      take: size,
      skip: (page - 1) * size,
      order: {
        time: "ASC",
      },
    });

    return { data, count };
  }

}
