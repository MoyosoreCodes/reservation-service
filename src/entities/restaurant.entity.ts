import { Column, Entity, Index, OneToMany } from "typeorm";

import { AbstractEntity } from "../common/abstract.entity";
import { BusinessHours } from "../common/enum/restaurant.enum";
import { Table } from "./table.entity";

@Entity()
@Index(["name"], { unique: true, where: "deleted_at IS NULL" })
export class Restaurant extends AbstractEntity {
  @Column()
  name: string;

  @Column("simple-json", { nullable: true })
  operatingHours: BusinessHours;

  @OneToMany(() => Table, (table) => table.restaurant)
  tables: Table[];
}
