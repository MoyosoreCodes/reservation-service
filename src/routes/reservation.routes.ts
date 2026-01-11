import { Request, Response, Router } from "express";
import { container } from "tsyringe";

import {
  CancelReservationDTO,
  CreateReservationDTO,
  createReservationSchema,
  getAllReservationsByRestaurantIdSchema,
  GetAllReservationsDTO,
  getAllReservationsSchema,
  getReservationByIdSchema,
  UpdateReservationDTO,
  updateReservationSchema,
} from "../common/dto/reservation.dto";
import { buildPagination } from "../common/pagination";
import { ReservationController } from "../controllers/reservation.controller";
import { validateRequest } from "../middleware/validation.middleware";

const router = Router();
const reservationController = container.resolve(ReservationController);

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationDto'
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Table or Restaurant not found
 */
router.post(
  "/",
  validateRequest({ body: createReservationSchema }),
  async (req, res) => {
    const result = await reservationController.create(
      req.body as CreateReservationDTO,
    );

    return res.status(201).json(result);
  },
);

/**
 * @swagger
 * /reservations/{restaurantId}:
 *   get:
 *     summary: Get all reservations for a specific restaurant on a given date
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the restaurant
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date for which to retrieve reservations
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
 *     responses:
 *       200:
 *         description: A list of reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
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
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 */
router.get(
  "/:restaurantId",
  validateRequest({
    params: getAllReservationsByRestaurantIdSchema,
    query: getAllReservationsSchema,
  }),
  async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    const dto = req.query as unknown as GetAllReservationsDTO;

    const { data, count } = await reservationController.findAll(
      restaurantId as string,
      dto,
    );
    const result = buildPagination(data, count, dto, req);

    return res.status(200).json(result);
  },
);

/**
 * @swagger
 * /reservations/{id}:
 *   patch:
 *     summary: Update an existing reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the reservation to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReservationDto'
 *     responses:
 *       200:
 *         description: Reservation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Bad request
 *       440:
 *         description: Reservation not found
 */
router.patch(
  "/:id",
  validateRequest({
    params: getReservationByIdSchema,
    body: updateReservationSchema,
  }),
  async (req, res) => {
    const result = await reservationController.update({
      ...req.params,
      ...req.body,
    } as UpdateReservationDTO);

    return res.status(200).json(result);
  },
);

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   patch:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the reservation to cancel
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Reservation not found or cannot be cancelled
 */
router.patch(
  "/:id/cancel",
  validateRequest({
    params: getReservationByIdSchema,
  }),
  async (req, res) => {
    const result = await reservationController.cancel({
      ...req.params,
    } as CancelReservationDTO);
    return res.status(200).json(result);
  },
);

export default router;
