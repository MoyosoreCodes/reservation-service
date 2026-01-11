import { Column, Entity, ManyToOne } from "typeorm";

import { AbstractEntity } from "../common/abstract.entity";
import { Restaurant } from "./restaurant.entity";

/**
 * @swagger
 * components:
 *   schemas:
 *     Table:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier of the table
 *         tableNumber:
 *           type: integer
 *           description: The number of the table
 *         capacity:
 *           type: integer
 *           description: The maximum capacity of the table
 *         restaurant:
 *           $ref: '#/components/schemas/Restaurant'
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
 */
@Entity()
export class Table extends AbstractEntity {
  @Column()
  tableNumber: number;

  @Column()
  capacity: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables)
  restaurant: Restaurant;
}
