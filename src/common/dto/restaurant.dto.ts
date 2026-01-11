import { z } from "zod";

import type { BusinessHours, WorkingHours } from "../enum/restaurant.enum";
import { paginationSchema } from "../pagination";

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkingHours:
 *       type: object
 *       properties:
 *         startTime:
 *           type: string
 *           format: "HH:mm"
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           format: "HH:mm"
 *           example: "22:00"
 *     BusinessHours:
 *       type: object
 *       properties:
 *         monday:
 *           $ref: '#/components/schemas/WorkingHours'
 *         tuesday:
 *           $ref: '#/components/schemas/WorkingHours'
 *         wednesday:
 *           $ref: '#/components/schemas/WorkingHours'
 *         thursday:
 *           $ref: '#/components/schemas/WorkingHours'
 *         friday:
 *           $ref: '#/components/schemas/WorkingHours'
 *         saturday:
 *           $ref: '#/components/schemas/WorkingHours'
 *         sunday:
 *           $ref: '#/components/schemas/WorkingHours'
 *     CreateRestaurantDto:
 *       type: object
 *       required:
 *         - name
 *         - businessHours
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the restaurant
 *           example: "My Awesome Restaurant"
 *         businessHours:
 *           $ref: '#/components/schemas/BusinessHours'
 *     Restaurant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier of the restaurant
 *         name:
 *           type: string
 *           description: The name of the restaurant
 *         operatingHours:
 *           $ref: '#/components/schemas/BusinessHours'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         tables:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Table'
 */

const workingHoursSchema: z.ZodType<WorkingHours> = z
  .object({
    startTime: z.string().transform((val, ctx) => {
      const date = new Date(`1970-01-01T${val}`);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid start time format. Use HH:mm format (e.g., 09:00).",
        });
        return z.NEVER;
      }
      return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    }),
    endTime: z.string().transform((val, ctx) => {
      const date = new Date(`1970-01-01T${val}`);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid end time format. Use HH:mm format (e.g., 22:00).",
        });
        return z.NEVER;
      }
      return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    }),
  })
  .refine(
    (data) => {
      const start = new Date(`1970-01-01T${data.startTime}`);
      const end = new Date(`1970-01-01T${data.endTime}`);
      return end > start;
    },
    {
      message: "End time must be after start time.",
    },
  );

export const businessHoursSchema: z.ZodType<BusinessHours> = z.object({
  monday: workingHoursSchema,
  tuesday: workingHoursSchema,
  wednesday: workingHoursSchema,
  thursday: workingHoursSchema,
  friday: workingHoursSchema,
  saturday: workingHoursSchema,
  sunday: workingHoursSchema,
});

export const createRestaurantSchema = z.object({
  name: z.string(),
  businessHours: businessHoursSchema,
});

export const getRestaurantByIdSchema = z.object({
  id: z.uuid(),
});

export const getAllRestaurantSchema = z.object().extend(paginationSchema.shape);

export const addTableToRestaurantSchema = z.object({
  restaurantId: z.uuid(),
  capacity: z.number(),
});

export const getAvailabilitySchema = z.object({
  id: z.uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  size: z.string().transform(Number).pipe(z.number().int().positive()),
  duration: z.string().transform(Number).pipe(z.number().int().positive()),
});

export type CreateRestaurantDto = z.infer<typeof createRestaurantSchema>;
export type GetRestaurantByIdDto = z.infer<typeof getRestaurantByIdSchema>;
export type GetAllRestaurantDto = z.infer<typeof getAllRestaurantSchema>;
export type AddTableToRestaurantDto = z.infer<
  typeof addTableToRestaurantSchema
>;
export type GetAvailabilityDto = z.infer<typeof getAvailabilitySchema>;
