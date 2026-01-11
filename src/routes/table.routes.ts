import { Request, Response, Router } from "express";
import { container } from "tsyringe";

import {
  createTableSchema,
  GetAvailableSlotsDTO,
  getAvailableSlotsSchema,
  IsTableAvailableDTO,
  isTableAvailableParamsSchema,
  isTableAvailableQuerySchema,
} from "../common/dto/table.dto";
import { TableController } from "../controllers/table.controller";
import { validateRequest } from "../middleware/validation.middleware";

const router = Router();
const tableController = container.resolve(TableController);

/**
 * @swagger
 * /tables/:
 *   post:
 *     summary: Add a new table to a restaurant
 *     tags: [Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTableDto'
 *     responses:
 *       201:
 *         description: Table created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Table'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 */
router.post(
  "/",
  validateRequest({
    body: createTableSchema,
  }),

  async (req: Request, res: Response) => {
    const result = await tableController.create(req.body);
    return res.status(201).json(result);
  }
);

/**
 * @swagger
 * /tables/{id}/is-available:
 *   get:
 *     summary: Check if a specific table is available for a time slot
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the table to check
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         required: true
 *         description: Day of the week
 *       - in: query
 *         name: time
 *         schema:
 *           type: string
 *           format: "HH:mm"
 *         required: true
 *         description: Start time of the reservation (e.g., 19:00)
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *         required: true
 *         description: Duration of the reservation in minutes
 *     responses:
 *       200:
 *         description: Table availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *       400:
 *         description: Bad request
 */
router.get(
  "/:id/is-available",
  validateRequest({
    params: isTableAvailableParamsSchema,
    query: isTableAvailableQuerySchema,
  }),
  async (req: Request, res: Response) => {
    const result = await tableController.isAvailable({
      ...req.params,
      ...req.query,
    } as unknown as IsTableAvailableDTO);
    res.status(200).json(result);
  }
);

/**
 * @swagger
 * /tables/available:
 *   get:
 *     summary: Get available time slots for a restaurant based on party size
 *     tags: [Tables]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the restaurant
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "YYYY-MM-DD"
 *         description: Start date for availability check (YYYY-MM-DD). Defaults to current date.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "YYYY-MM-DD"
 *         description: End date for availability check (YYYY-MM-DD). Defaults to current date + 7 days.
 *       - in: query
 *         name: partySize
 *         schema:
 *           type: integer
 *         required: true
 *         description: Size of the party
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           default: 60
 *         required: true
 *         description: Duration of the reservation in minutes
 *     responses:
 *       200:
 *         description: List of available time slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 format: "HH:mm"
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 */
router.get(
  "/available",
  validateRequest({
    query: getAvailableSlotsSchema,
  }),
  async (req: Request, res: Response) => {
    const result = await tableController.getAvailableSlots(
      req.query as unknown as GetAvailableSlotsDTO
    );
    res.status(200).json(result);
  }
);

export default router;
