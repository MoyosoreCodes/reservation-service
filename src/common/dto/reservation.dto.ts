import { z } from "zod";

import { ReservationStatus } from "../enum/reservation.enum"; // Import ReservationStatus
import { paginationSchema } from "../pagination";
import { operatingDays } from "../utils/";

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateReservationDto:
 *       type: object
 *       required:
 *         - customerName
 *         - phone
 *         - size
 *         - day
 *         - time
 *         - duration
 *         - tableId
 *       properties:
 *         customerName:
 *           type: string
 *           description: Name of the customer
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           description: Customer's phone number
 *           example: "123-456-7890"
 *         size:
 *           type: integer
 *           description: Size of the party
 *           example: 4
 *         day:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *           description: Day of the week for the reservation
 *           example: "monday"
 *         time:
 *           type: string
 *           format: "HH:mm"
 *           description: Start time of the reservation
 *           example: "19:00"
 *         duration:
 *           type: integer
 *           description: Duration of the reservation in minutes
 *           example: 120
 *         tableId:
 *           type: string
 *           format: uuid
 *           description: ID of the table to reserve
 *     UpdateReservationDto:
 *       type: object
 *       properties:
 *         customerName:
 *           type: string
 *           description: Name of the customer
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           description: Customer's phone number
 *           example: "123-456-7890"
 *         size:
 *           type: integer
 *           description: Size of the party
 *           example: 4
 *         time:
 *           type: string
 *           format: "HH:mm"
 *           description: Start time of the reservation
 *           example: "19:00"
 *         duration:
 *           type: integer
 *           description: Duration of the reservation in minutes
 *           example: 120
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *           description: The status of the reservation
 *           example: "confirmed"
 *         tableId:
 *           type: string
 *           format: uuid
 *           description: ID of the table to reserve
 *     CancelReservationDto:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier of the reservation to cancel
 */
export const createReservationSchema = z.object({
  customerName: z.string({ error: "Customer name is required." }),
  phone: z.string({ error: "Phone number is required." }),
  size: z
    .number({ error: "Party size is required." })
    .int()
    .positive("Party size must be a positive number."),
  day: z.enum(operatingDays, {
    message: `Invalid day. Please provide a valid day of the week (e.g., "${operatingDays[0]}").`,
  }),
  time: z.string({ error: "Time is required." }).transform((val, ctx) => {
    const date = new Date(`1970-01-01T${val}`);
    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: "custom",
        message:
          "Invalid time format. Please use a valid time string in HH:mm format (e.g., 19:00).",
      });
      return z.NEVER;
    }
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  }),
  duration: z
    .int({ error: "Duration is required." })
    .positive("Duration must be a positive number."),
  tableId: z.uuid({ error: "Table Id is required." }),
});

export const getAllReservationsSchema = z
  .object({
    startDate: z.preprocess(
      (val) => val || new Date().toISOString().split("T")[0],
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        .optional(),
    ),
    endDate: z.preprocess(
      (val) => {
        if (val) return val;
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split("T")[0];
      },
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        .optional(),
    ),
  })
  .extend(paginationSchema.shape);

export const getAllReservationsByRestaurantIdSchema = z.object({
  restaurantId: z.uuid({ error: "Restaurant Id is required" }),
});

export const getReservationByIdSchema = z.object({
  id: z.uuid({ error: "Reservation ID is required." }),
});

export const updateReservationStatusSchema = z.object({
  status: z.enum(ReservationStatus).optional(),
});

export const updateReservationSchema = createReservationSchema
  .and(updateReservationStatusSchema)
  .and(getReservationByIdSchema);

export const cancelReservationSchema = getReservationByIdSchema;

export type CreateReservationDTO = z.infer<typeof createReservationSchema>;
export type GetAllReservationsDTO = z.infer<typeof getAllReservationsSchema>;
export type UpdateReservationDTO = z.infer<typeof updateReservationSchema>;
export type CancelReservationDTO = z.infer<typeof cancelReservationSchema>;
