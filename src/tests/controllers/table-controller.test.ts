import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { container } from "tsyringe";

import "reflect-metadata";

import { ContentNotFoundError } from "../../common/errors";
import { TableController } from "../../controllers/table.controller";
import { ReservationService } from "../../services/reservation.service";
import { RestaurantService } from "../../services/restaurant.service";
import { TableService } from "../../services/table.service";

describe("TableController", () => {
  let tableController: TableController;
  let mockRestaurantService: jest.Mocked<RestaurantService>;
  let mockTableService: jest.Mocked<TableService>;
  let mockReservationService: jest.Mocked<ReservationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRestaurantService = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    } as any;

    mockTableService = {
      create: jest.fn(),
      findById: jest.fn(),
      isTableAvailable: jest.fn(),
      getAvailableTimeSlots: jest.fn(),
    } as any;

    mockReservationService = {
      create: jest.fn(),
      findAll: jest.fn(),
    } as any;

    container.clearInstances();
    container.registerInstance(RestaurantService, mockRestaurantService);
    container.registerInstance(TableService, mockTableService);
    container.registerInstance(ReservationService, mockReservationService);

    tableController = container.resolve(TableController);
  });

  describe("create", () => {
    it("should create a table successfully", async () => {
      const createDto = {
        capacity: 4,
        restaurantId: "restaurant-uuid",
        tableNumber: 1,
      };
      const mockRestaurant = {
        id: "restaurant-uuid",
        name: "Test Rest",
      } as any;
      const createdTable = {
        id: "table-uuid",
        capacity: 4,
        tableNumber: 1,
        restaurant: mockRestaurant,
      } as any;

      mockRestaurantService.findById.mockResolvedValue(mockRestaurant);
      mockTableService.create.mockResolvedValue(createdTable);

      const result = await tableController.create(createDto);
      expect(result).toEqual(createdTable);
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(
        createDto.restaurantId,
      );
      expect(mockTableService.create).toHaveBeenCalledWith(
        { capacity: createDto.capacity },
        mockRestaurant,
      );
    });

    it("should throw ContentNotFoundError if restaurant is not found", async () => {
      const createDto = {
        capacity: 4,
        restaurantId: "non-existent-restaurant-uuid",
        tableNumber: 1,
      };
      mockRestaurantService.findById.mockRejectedValue(
        new ContentNotFoundError("Restaurant not found"),
      );

      await expect(tableController.create(createDto)).rejects.toThrow(
        ContentNotFoundError,
      );
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(
        createDto.restaurantId,
      );
      expect(mockTableService.create).not.toHaveBeenCalled();
    });
  });

  describe("isAvailable", () => {
    it("should return true if table is available", async () => {
      const isAvailableDto = {
        id: "table-uuid",
        day: "Monday",
        time: "10:00",
        duration: 60,
      };
      mockTableService.findById.mockResolvedValue({ id: "table-uuid" } as any);
      mockTableService.isTableAvailable.mockResolvedValue(true);

      const result = await tableController.isAvailable(isAvailableDto);
      expect(result).toBe(true);
      expect(mockTableService.findById).toHaveBeenCalledWith(isAvailableDto.id);
      expect(mockTableService.isTableAvailable).toHaveBeenCalledWith(
        isAvailableDto,
      );
    });

    it("should return false if table is not available", async () => {
      const isAvailableDto = {
        id: "table-uuid",
        day: "Monday",
        time: "10:00",
        duration: 60,
      };
      mockTableService.findById.mockResolvedValue({ id: "table-uuid" } as any);
      mockTableService.isTableAvailable.mockResolvedValue(false);

      const result = await tableController.isAvailable(isAvailableDto);
      expect(result).toBe(false);
      expect(mockTableService.findById).toHaveBeenCalledWith(isAvailableDto.id);
      expect(mockTableService.isTableAvailable).toHaveBeenCalledWith(
        isAvailableDto,
      );
    });

    it("should throw ContentNotFoundError if table is not found", async () => {
      const isAvailableDto = {
        id: "non-existent-table-uuid",
        day: "Monday",
        time: "10:00",
        duration: 60,
      };
      mockTableService.findById.mockRejectedValue(
        new ContentNotFoundError("Table not found"),
      );

      await expect(tableController.isAvailable(isAvailableDto)).rejects.toThrow(
        ContentNotFoundError,
      );
      expect(mockTableService.findById).toHaveBeenCalledWith(isAvailableDto.id);
      expect(mockTableService.isTableAvailable).not.toHaveBeenCalled();
    });
  });

  describe("getAvailableSlots", () => {
    it("should return available slots successfully", async () => {
      const getSlotsDto = {
        restaurantId: "restaurant-uuid",
        size: 2,
        duration: 60,
        startDate: "2026-01-13",
        endDate: "2026-01-13",
      };
      const mockRestaurant = {
        id: "restaurant-uuid",
        name: "Test Rest",
      } as any;
      const availableSlots = { "2026-01-13": ["10:00", "11:00"] };

      mockRestaurantService.findById.mockResolvedValue(mockRestaurant);
      mockTableService.getAvailableTimeSlots.mockResolvedValue(availableSlots);

      const result = await tableController.getAvailableSlots(getSlotsDto);
      expect(result).toEqual(availableSlots);
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(
        getSlotsDto.restaurantId,
      );
      expect(mockTableService.getAvailableTimeSlots).toHaveBeenCalledWith(
        mockRestaurant,
        getSlotsDto,
      );
    });

    it("should throw ContentNotFoundError if restaurant is not found", async () => {
      const getSlotsDto = {
        restaurantId: "non-existent-restaurant-uuid",
        size: 2,
        duration: 60,
        startDate: "2026-01-13",
        endDate: "2026-01-13",
      };
      mockRestaurantService.findById.mockRejectedValue(
        new ContentNotFoundError("Restaurant not found"),
      );

      await expect(
        tableController.getAvailableSlots(getSlotsDto),
      ).rejects.toThrow(ContentNotFoundError);
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(
        getSlotsDto.restaurantId,
      );
      expect(mockTableService.getAvailableTimeSlots).not.toHaveBeenCalled();
    });
  });
});
