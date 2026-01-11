import { Column, Entity, Index, ManyToOne } from "typeorm";

import { AbstractEntity } from "../common/abstract.entity";
import { Table } from "./table.entity";

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier of the reservation
 *         customerName:
 *           type: string
 *           description: Name of the customer
 *         phone:
 *           type: string
 *           description: Customer's phone number
 *         size:
 *           type: integer
 *           description: Size of the party
 *         time:
 *           type: string
 *           format: date-time
 *           description: Start time of the reservation
 *         duration:
 *           type: integer
 *           description: Duration of the reservation in minutes
 *         table:
 *           $ref: '#/components/schemas/Table'
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
@Index(["table", "time"], { unique: true, where: "deleted_at IS NULL" })
export class Reservation extends AbstractEntity {
  @Column()
  customerName: string;

  @Column()
  phone: string;

  @Column()
  size: number;

  @Column()
  time: Date;

  @Column()
  duration: number;

  @ManyToOne(() => Table)
  table: Table;
}
