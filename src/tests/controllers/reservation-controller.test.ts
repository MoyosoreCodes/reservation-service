/// <reference types="jest" />
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { container } from "tsyringe";

import "reflect-metadata";

import { ClientError, ContentNotFoundError } from "../../common/errors";
import { ReservationController } from "../../controllers/reservation.controller";
import { ReservationService } from "../../services/reservation.service";
import { TableService } from "../../services/table.service";

describe("ReservationController", () => {
  let reservationController: ReservationController;
  let mockReservationService: jest.Mocked<ReservationService>;
  let mockTableService: jest.Mocked<TableService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReservationService = {
      create: jest.fn(),
      findAll: jest.fn(),
    } as any;

    mockTableService = {
      create: jest.fn(),
      findById: jest.fn(),
    } as any;

    container.clearInstances();
    container.registerInstance(ReservationService, mockReservationService);
    container.registerInstance(TableService, mockTableService);

    reservationController = container.resolve(ReservationController);
  });

  describe("create", () => {
    it("should create a reservation successfully", async () => {
      const createDto = {
        customerName: "John Doe",
        phone: "123-456-7890",
        size: 4,
        day: "monday",
        time: "09:00",
        duration: 120,
        tableId: "table-uuid",
      };
      const mockTable = {
        id: "table-uuid",
        capacity: 6,
        tableNumber: 1,
        restaurant: { id: "restaurant-uuid" },
      } as any;
      const createdReservation = {
        id: "res-uuid",
        ...createDto,
        table: mockTable,
      };

      mockTableService.findById.mockResolvedValue(mockTable);
      mockReservationService.create.mockResolvedValue(
        createdReservation as any,
      );

      const result = await reservationController.create(createDto);
      expect(result).toEqual(createdReservation);
      expect(mockTableService.findById).toHaveBeenCalledWith(createDto.tableId);
      expect(mockReservationService.create).toHaveBeenCalledWith(
        createDto,
        mockTable,
      );
    });

    it("should throw ContentNotFoundError if table is not found", async () => {
      const createDto = {
        customerName: "John Doe",
        phone: "123-456-7890",
        size: 4,
        day: "monday",
        time: "09:00",
        duration: 120,
        tableId: "non-existent-table-uuid",
      };

      mockTableService.findById.mockRejectedValue(
        new ContentNotFoundError("Table not found"),
      );

      await expect(reservationController.create(createDto)).rejects.toThrow(
        ContentNotFoundError,
      );
      expect(mockTableService.findById).toHaveBeenCalledWith(createDto.tableId);
      expect(mockReservationService.create).not.toHaveBeenCalled();
    });

    it("should throw ClientError if reservation creation fails due => client-side issue (e.g., table not available)", async () => {
      const createDto = {
        customerName: "John Doe",
        phone: "123-456-7890",
        size: 4,
        day: "monday",
        time: "09:00",
        duration: 120,
        tableId: "table-uuid",
      };
      const mockTable = {
        id: "table-uuid",
        capacity: 6,
        tableNumber: 1,
        restaurant: { id: "restaurant-uuid" },
      } as any;

      mockTableService.findById.mockResolvedValue(mockTable);
      mockReservationService.create.mockRejectedValue(
        new ClientError("Table not available at this time"),
      );

      await expect(reservationController.create(createDto)).rejects.toThrow(
        ClientError,
      );
      expect(mockTableService.findById).toHaveBeenCalledWith(createDto.tableId);
      expect(mockReservationService.create).toHaveBeenCalledWith(
        createDto,
        mockTable,
      );
    });
  });

  describe("findAll", () => {
    it("should return a list of reservations for a restaurant", async () => {
      const restaurantId = "restaurant-uuid";
      const getAllDto = {
        page: 1,
        size: 10,
        startDate: "2026-01-13",
        endDate: "2026-01-13",
        search: undefined,
      };
      const reservations = { data: [{ id: "res1" }], count: 1 } as any;
      mockReservationService.findAll.mockResolvedValue(reservations);

      const result = await reservationController.findAll(
        restaurantId,
        getAllDto,
      );
      expect(result).toEqual(reservations);
      expect(mockReservationService.findAll).toHaveBeenCalledWith(
        restaurantId,
        getAllDto,
      );
    });
  });
});
