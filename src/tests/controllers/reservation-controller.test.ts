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
      findById: jest.fn(),
      update: jest.fn(),
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

  describe("update", () => {
    const reservationId = "reservation-uuid";
    const mockExistingReservation = {
      id: reservationId,
      customerName: "Old Name",
      phone: "111-222-3333",
      size: 2,
      time: new Date("2026-01-15T10:00:00Z"),
      duration: 60,
      table: {
        id: "table-uuid-1",
        capacity: 4,
        restaurant: { id: "rest-uuid" },
      },
      status: "pending",
    };

    it("should update a reservation successfully with partial updates", async () => {
      const updateDto = {
        id: reservationId,
        customerName: "New Name",
        size: 3,
      };
      const updatedReservation = { ...mockExistingReservation, ...updateDto };

      mockReservationService.findById.mockResolvedValue(
        mockExistingReservation as any,
      );
      mockReservationService.update.mockResolvedValue(
        updatedReservation as any,
      );

      const result = await reservationController.update(updateDto as any);

      expect(result).toEqual(updatedReservation);
      expect(mockReservationService.update).toHaveBeenCalledWith(
        reservationId,
        { customerName: "New Name", size: 3 },
        undefined,
      );
    });

    it("should update a reservation successfully with tableId change", async () => {
      const newTableId = "table-uuid-2";
      const updateDto = {
        id: reservationId,
        tableId: newTableId,
        size: 4,
      };
      const mockNewTable = {
        id: newTableId,
        capacity: 6,
        restaurant: { id: "rest-uuid" },
      };
      const updatedReservation = {
        ...mockExistingReservation,
        table: mockNewTable,
        size: 4,
      };

      mockReservationService.findById.mockResolvedValue(
        mockExistingReservation as any,
      );
      mockTableService.findById.mockResolvedValue(mockNewTable as any);
      mockReservationService.update.mockResolvedValue(
        updatedReservation as any,
      );

      const result = await reservationController.update(updateDto as any);

      expect(result).toEqual(updatedReservation);
      expect(mockReservationService.findById).toHaveBeenCalledWith(
        reservationId,
      );
      expect(mockTableService.findById).toHaveBeenCalledWith(newTableId);
      expect(mockReservationService.update).toHaveBeenCalledWith(
        reservationId,
        { size: 4 },
        mockNewTable,
      );
    });

    it("should throw ContentNotFoundError if reservation to update is not found", async () => {
      const updateDto = { id: "non-existent-id", customerName: "New Name" };

      mockReservationService.findById.mockRejectedValue(
        new ContentNotFoundError("Reservation not found"),
      );

      await expect(
        reservationController.update(updateDto as any),
      ).rejects.toThrow(ContentNotFoundError);
      expect(mockReservationService.findById).toHaveBeenCalledWith(
        "non-existent-id",
      );
      expect(mockReservationService.update).not.toHaveBeenCalled();
    });

    it("should throw ClientError for invalid status transition", async () => {
      const updateDto = { id: reservationId, status: "completed" }; // Assuming pending -> completed is invalid
      const mockReservationWithStatus = {
        ...mockExistingReservation,
        status: "confirmed",
      };

      mockReservationService.findById.mockResolvedValue(
        mockReservationWithStatus as any,
      );
      mockReservationService.update.mockRejectedValue(
        new ClientError(
          "Cannot transition reservation from confirmed to completed",
        ),
      );

      await expect(
        reservationController.update(updateDto as any),
      ).rejects.toThrow(ClientError);
      expect(mockReservationService.findById).toHaveBeenCalledWith(
        reservationId,
      );
      expect(mockReservationService.update).toHaveBeenCalledWith(
        reservationId,
        { status: "completed" },
        undefined,
      );
    });

    it("should throw ClientError if table is not found when changing tableId", async () => {
      const newTableId = "non-existent-table-id";
      const updateDto = { id: reservationId, tableId: newTableId };

      mockReservationService.findById.mockResolvedValue(
        mockExistingReservation as any,
      );
      mockTableService.findById.mockRejectedValue(
        new ContentNotFoundError("Table not found"),
      );

      await expect(
        reservationController.update(updateDto as any),
      ).rejects.toThrow(ContentNotFoundError);
      expect(mockReservationService.findById).toHaveBeenCalledWith(
        reservationId,
      );
      expect(mockTableService.findById).toHaveBeenCalledWith(newTableId);
      expect(mockReservationService.update).not.toHaveBeenCalled();
    });

    it("should throw ClientError if reservation update fails due to client-side issue (e.g., table not available)", async () => {
      const updateDto = { id: reservationId, time: "12:00" };
      const mockReservationWithTable = {
        ...mockExistingReservation,
        table: {
          id: "table-uuid-1",
          capacity: 4,
          restaurant: { id: "rest-uuid" },
        },
      };

      mockReservationService.findById.mockResolvedValue(
        mockReservationWithTable as any,
      );
      mockReservationService.update.mockRejectedValue(
        new ClientError("Table is already reserved for the selected time slot"),
      );

      await expect(
        reservationController.update(updateDto as any),
      ).rejects.toThrow(ClientError);
      expect(mockReservationService.findById).toHaveBeenCalledWith(
        reservationId,
      );
      expect(mockReservationService.update).toHaveBeenCalledWith(
        reservationId,
        { time: "12:00" },
        undefined,
      );
    });
  });
});
