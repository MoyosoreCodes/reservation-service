import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { container } from "tsyringe";

import "reflect-metadata";

import { businessHoursSchema } from "../../common/dto/restaurant.dto";
import { ClientError, ContentNotFoundError } from "../../common/errors";
import { RestaurantController } from "../../controllers/restaurant.controller";
import { ReservationService } from "../../services/reservation.service";
import { RestaurantService } from "../../services/restaurant.service";
import { TableService } from "../../services/table.service";

describe("RestaurantController", () => {
  let restaurantController: RestaurantController;
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
    } as any;

    mockReservationService = {
      create: jest.fn(),
      findAll: jest.fn(),
    } as any;

    container.clearInstances();
    container.registerInstance(RestaurantService, mockRestaurantService);
    container.registerInstance(TableService, mockTableService);
    container.registerInstance(ReservationService, mockReservationService);

    restaurantController = container.resolve(RestaurantController);
  });

  describe("create", () => {
    it("should create a restaurant successfully", async () => {
      const createDto = {
        name: "Test Restaurant",
        businessHours: businessHoursSchema.parse({
          monday: { startTime: "09:00", endTime: "17:00" },
          tuesday: { startTime: "09:00", endTime: "17:00" },
          wednesday: { startTime: "09:00", endTime: "17:00" },
          thursday: { startTime: "09:00", endTime: "17:00" },
          friday: { startTime: "09:00", endTime: "17:00" },
          saturday: { startTime: "09:00", endTime: "17:00" },
          sunday: { startTime: "09:00", endTime: "17:00" },
        }),
      };
      const createdRestaurant = { id: "1", ...createDto };
      mockRestaurantService.create.mockResolvedValue(createdRestaurant as any);

      const result = await restaurantController.create(createDto);
      expect(result).toEqual(createdRestaurant);
      expect(mockRestaurantService.create).toHaveBeenCalledWith(createDto);
    });

    it("should throw ClientError if restaurant creation fails due to client-side issue", async () => {
      const createDto = {
        name: "Invalid Restaurant",
        businessHours: businessHoursSchema.parse({
          monday: { startTime: "09:00", endTime: "17:00" },
          tuesday: { startTime: "09:00", endTime: "17:00" },
          wednesday: { startTime: "09:00", endTime: "17:00" },
          thursday: { startTime: "09:00", endTime: "17:00" },
          friday: { startTime: "09:00", endTime: "17:00" },
          saturday: { startTime: "09:00", endTime: "17:00" },
          sunday: { startTime: "09:00", endTime: "17:00" },
        }),
      };
      mockRestaurantService.create.mockRejectedValue(
        new ClientError("Invalid data"),
      );

      await expect(restaurantController.create(createDto)).rejects.toThrow(
        ClientError,
      );
      expect(mockRestaurantService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe("findById", () => {
    it("should return a restaurant if found", async () => {
      const restaurantId = "some-uuid";
      const foundRestaurant = {
        id: restaurantId,
        name: "Found Restaurant",
        businessHours: {},
      } as any;
      mockRestaurantService.findById.mockResolvedValue(foundRestaurant);

      const result = await restaurantController.findById({ id: restaurantId });
      expect(result).toEqual(foundRestaurant);
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(restaurantId);
    });

    it("should throw ContentNotFoundError if restaurant is not found", async () => {
      const restaurantId = "non-existent-uuid";
      mockRestaurantService.findById.mockRejectedValue(
        new ContentNotFoundError(`Restaurant: ${restaurantId} not found`),
      );

      await expect(
        restaurantController.findById({ id: restaurantId }),
      ).rejects.toThrow(ContentNotFoundError);
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(restaurantId);
    });

    it("should throw ClientError for invalid ID format", async () => {
      const invalidId = "invalid-id-format";
      mockRestaurantService.findById.mockRejectedValue(
        new ClientError("Invalid ID format"),
      );

      await expect(
        restaurantController.findById({ id: invalidId }),
      ).rejects.toThrow(ClientError);
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(invalidId);
    });
  });

  describe("findAll", () => {
    it("should return a list of restaurants", async () => {
      const paginationDto = { page: 1, size: 10, search: undefined };
      const restaurants = {
        data: [{ id: "1", name: "Rest 1" }],
        count: 1,
      } as any;
      mockRestaurantService.findAll.mockResolvedValue(restaurants);

      const result = await restaurantController.findAll(paginationDto);
      expect(result).toEqual(restaurants);
      expect(mockRestaurantService.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe("addTable", () => {
    it("should add a table to a restaurant successfully", async () => {
      const addTableDto = {
        restaurantId: "rest-uuid",
        capacity: 4,
        tableNumber: 1,
      };
      const mockRestaurant = {
        id: "rest-uuid",
        name: "Test Rest",
        businessHours: {},
      } as any;
      const createdTable = {
        id: "table-uuid",
        capacity: 4,
        tableNumber: 1,
        restaurant: mockRestaurant,
      } as any;

      mockRestaurantService.findById.mockResolvedValue(mockRestaurant);
      mockTableService.create.mockResolvedValue(createdTable);

      const result = await restaurantController.addTable(addTableDto);
      expect(result).toEqual(createdTable);
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(
        addTableDto.restaurantId,
      );
      expect(mockTableService.create).toHaveBeenCalledWith(
        { capacity: addTableDto.capacity },
        mockRestaurant,
      );
    });

    it("should throw ContentNotFoundError if restaurant is not found when adding table", async () => {
      const addTableDto = {
        restaurantId: "non-existent-rest-uuid",
        capacity: 4,
        tableNumber: 1,
      };
      mockRestaurantService.findById.mockRejectedValue(
        new ContentNotFoundError("Restaurant not found"),
      );

      await expect(restaurantController.addTable(addTableDto)).rejects.toThrow(
        ContentNotFoundError,
      );
      expect(mockRestaurantService.findById).toHaveBeenCalledWith(
        addTableDto.restaurantId,
      );
      expect(mockTableService.create).not.toHaveBeenCalled();
    });
  });
});
