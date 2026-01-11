import { z } from "zod";

import { operatingDays } from "../utils";

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTableDto:
 *       type: object
 *       required:
 *         - restaurantId
 *         - capacity
 *       properties:
 *         restaurantId:
 *           type: string
 *           format: uuid
 *           description: The ID of the restaurant the table belongs to
 *         capacity:
 *           type: integer
 *           description: The maximum capacity of the table
 */
export const createTableSchema = z.object({
  restaurantId: z.uuid({ error: "Table Id is required" }),
  capacity: z
    .int({ error: "Table capacity is required" })
    .positive("Capacity must be a positive integer"),
});

export const isTableAvailableParamsSchema = z.object({
  id: z.uuid({ error: "Table Id is required" }),
});

export const isTableAvailableQuerySchema = z.object({
  day: z.enum(operatingDays, {
    message: `Invalid day. Please provide a valid day of the week (e.g., "${operatingDays[0]}").`,
  }),
  time: z.string({ error: "Time is required." }).transform((val, ctx) => {
    const date = new Date(`1970-01-01T${val}`); // Fixed syntax
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
  duration: z.coerce
    .number({ error: "Duration is required." })
    .int()
    .positive("Duration must be a positive number."),
});

export const getAvailableSlotsSchema = z.object({
  restaurantId: z.uuid({ error: "Restaurant ID is required" }),
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
  size: z.coerce
    .number({ error: "Party size is required." })
    .int()
    .positive("Party size must be a positive integer."),
  duration: z.coerce
    .number({ error: "Duration is required." })
    .int()
    .positive("Duration must be a positive number."),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     GetAvailableSlotsDto:
 *       type: object
 *       required:
 *         - restaurantId
 *         - size
 *         - duration
 *       properties:
 *         restaurantId:
 *           type: string
 *           format: uuid
 *           description: ID of the restaurant
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date for availability check (YYYY-MM-DD). Defaults to current date.
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date for availability check (YYYY-MM-DD). Defaults to current date + 7 days.
 *         size:
 *           type: integer
 *           description: Size of the party
 *         duration:
 *           type: integer
 *           description: Duration of the reservation in minutes
 */

const isTableAvailableSchema = isTableAvailableQuerySchema.and(
  isTableAvailableParamsSchema
);

export type CreateTableDTO = z.infer<typeof createTableSchema>;
export type IsTableAvailableDTO = z.infer<typeof isTableAvailableSchema>;
export type GetAvailableSlotsDTO = z.infer<typeof getAvailableSlotsSchema>;
