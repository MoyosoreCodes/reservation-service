import { Request, Response, Router } from "express";
import { container } from "tsyringe";

import {
  createRestaurantSchema,
  GetAllRestaurantDto,
  getAllRestaurantSchema,
  GetRestaurantByIdDto,
  getRestaurantByIdSchema,
} from "../common/dto/restaurant.dto";
import { buildPagination } from "../common/pagination";
import { RestaurantController } from "../controllers/restaurant.controller";
import { validateRequest } from "../middleware/validation.middleware";

const router = Router();
const restaurantController = container.resolve(RestaurantController);

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRestaurantDto'
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  validateRequest({ body: createRestaurantSchema }),
  async (req: Request, res: Response) => {
    const result = await restaurantController.create(req.body);
    res.status(201).json(result);
  },
);

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for restaurant name
 *     responses:
 *       200:
 *         description: A list of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     size:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *                 links:
 *                   type: object
 *                   properties:
 *                     self:
 *                       type: string
 *                     next:
 *                       type: string
 *                     prev:
 *                       type: string
 */
router.get(
  "/",
  validateRequest({ query: getAllRestaurantSchema }),
  async (req: Request, res: Response) => {
    const dto = req.query as unknown as GetAllRestaurantDto;
    const { data, count } = await restaurantController.findAll(dto);

    const result = buildPagination(data, count, dto, req);
    return res.status(200).json(result);
  },
);

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the restaurant to retrieve
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found
 */
router.get(
  "/:id",
  validateRequest({ params: getRestaurantByIdSchema }),
  async (req: Request, res: Response) => {
    const result = await restaurantController.findById(
      req.params as GetRestaurantByIdDto,
    );

    return res.status(200).json(result);
  },
);

export default router;
