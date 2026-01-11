import { z } from "zod";

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
      z.string()
    ),
    endDate: z.preprocess((val) => {
      if (val) return val;
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date.toISOString().split("T")[0];
    }, z.string()),
  })
  .extend(paginationSchema.shape);

export const getAllReservationsByRestaurantIdSchema = z.object({
  restaurantId: z.uuid({ error: "Restaurant Id is required" }),
});

export type CreateReservationDTO = z.infer<typeof createReservationSchema>;
export type GetAllReservationsDTO = z.infer<typeof getAllReservationsSchema>;
