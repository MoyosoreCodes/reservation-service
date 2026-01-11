import { Between, IsNull, LessThan, Repository } from "typeorm";

import {
  CreateReservationDTO,
  GetAllReservationsDTO,
  UpdateReservationDTO,
} from "../common/dto/reservation.dto";
import { ReservationStatus } from "../common/enum/reservation.enum";
import { ClientError, ContentNotFoundError } from "../common/errors";
import {
  duplicateErrorHandler,
  getNextDateForDay,
  hasTimeRangeOverlap,
  parseTimeToDate,
  RedisCache,
} from "../common/utils";
import { dataSource } from "../config/database.config";
import { Reservation } from "../entities/reservation.entity";
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

    await this.validateReservation(
      null,
      table,
      reservationTime as Date,
      duration,
      size,
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
        `available_slots:${table.restaurant.id}:${reservationDate}:*`,
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
      throw new ContentNotFoundError(`Reservation ${id} not found`);

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

  async cancelReservation(id: string) {
    const reservation = await this._reservationRepository.findOne({
      where: { id },
      relations: ["table", "table.restaurant"],
    });

    if (!reservation)
      throw new ContentNotFoundError(`Reservation ${id} not found.`);

    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    )
      throw new ClientError(
        `Reservation ${id} cannot be cancelled as its current status is ${reservation.status}. Only PENDING or CONFIRMED reservations can be cancelled.`,
      );

    reservation.status = ReservationStatus.CANCELLED;

    const cancelledReservation =
      await this._reservationRepository.save(reservation);

    const reservationDate = cancelledReservation.time
      .toISOString()
      .split("T")[0];
    await RedisCache.deletePattern(
      `available_slots:${cancelledReservation.table.restaurant.id}:${reservationDate}:*`,
    );

    return cancelledReservation;
  }

  async update(
    id: string,
    updates: Omit<UpdateReservationDTO, "id" | "tableId">,
    newTable?: Table,
  ) {
    const reservation = await this._reservationRepository.findOne({
      where: { id },
      relations: ["table", "table.restaurant"],
    });

    if (!reservation)
      throw new ContentNotFoundError(`Reservation ${id} not found.`);

    this.validateStatusTransition(reservation.status, updates.status);

    if (
      updates.time ||
      updates.day ||
      updates.duration ||
      updates.size ||
      newTable
    ) {
      const table = newTable || reservation.table;
      let newTime = reservation.time;

      if (updates.day || updates.time) {
        const day =
          updates.day ||
          reservation.time
            .toLocaleDateString("en-US", { weekday: "long" })
            .toLowerCase();
        const timeStr =
          updates.time ||
          reservation.time.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          });
        const nextTime = getNextDateForDay(day, timeStr);
        if (nextTime === -1) throw new ClientError(`Invalid day: ${day}`);

        newTime = nextTime;
      }

      const newDuration = updates.duration || reservation.duration;
      const newSize = updates.size || reservation.size;

      await this.validateReservation(
        reservation.id,
        table,
        newTime,
        newDuration,
        newSize,
      );

      if (updates.day || updates.time)
        updates.time = newTime.toLocaleDateString("en-US", { weekday: "long" });
    }

    if (newTable) reservation.table = newTable;

    Object.assign(reservation, updates);
    const updatedReservation =
      await this._reservationRepository.save(reservation);

    const reservationDate = updatedReservation.time.toISOString().split("T")[0];
    await RedisCache.deletePattern(
      `available_slots:${updatedReservation.table.restaurant.id}:${reservationDate}:*`,
    );

    return updatedReservation;
  }

  private validateStatusTransition(
    current: ReservationStatus,
    newStatus?: ReservationStatus,
  ) {
    if (!newStatus || newStatus === current) return;

    const transitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [
        ReservationStatus.CONFIRMED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.CANCELLED],
      [ReservationStatus.CANCELLED]: [],
      [ReservationStatus.COMPLETED]: [],
    };

    if (!transitions[current].includes(newStatus))
      throw new ClientError(
        `Cannot transition reservation from ${current} to ${newStatus}`,
      );
  }

  private async validateReservation(
    reservationId: string | null,
    table: Table,
    time: Date,
    duration: number,
    size: number,
  ) {
    if (size > table.capacity)
      throw new ClientError("Party size exceeds table capacity");

    const dayOfWeek = time
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const operatingHours =
      table.restaurant.operatingHours[
        dayOfWeek as keyof typeof table.restaurant.operatingHours
      ];

    if (!operatingHours)
      throw new ClientError(`Restaurant is closed on ${dayOfWeek}`);

    const dateStr = time.toISOString().split("T")[0];
    const openingTime = parseTimeToDate(dateStr, operatingHours.startTime);
    const closingTime = parseTimeToDate(dateStr, operatingHours.endTime);

    const outsideOperatingTime = time < openingTime || time > closingTime;
    if (outsideOperatingTime)
      throw new ClientError("Reservation time is outside operating hours");

    const endTime = new Date(time.getTime() + duration * 60000);
    const conflicts = await this._reservationRepository.find({
      where: {
        table: { id: table.id },
        time: LessThan(endTime),
        deletedAt: IsNull(),
      },
    });

    const hasOverlap = conflicts
      .filter((c) => !reservationId || c.id !== reservationId)
      .some((c) => {
        const cEnd = new Date(c.time.getTime() + c.duration * 60000);
        return hasTimeRangeOverlap(time, endTime, c.time, cEnd);
      });

    if (hasOverlap)
      throw new ClientError(
        "Table is already reserved for the selected time slot",
      );
  }
}
