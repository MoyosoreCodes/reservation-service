/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddStatusToReservation1768141912189 {
  name = "AddStatusToReservation1768141912189";

  /**
   * @param {QueryRunner} queryRunner
   */
  async up(queryRunner) {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e8efed941be4650654d2022ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD "status" text NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_07b327cb84c095567c6a310554" ON "restaurant" ("name") WHERE deleted_at IS NULL`,
    );
  }

  /**
   * @param {QueryRunner} queryRunner
   */
  async down(queryRunner) {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_07b327cb84c095567c6a310554"`,
    );
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9e8efed941be4650654d2022ec" ON "restaurant" ("name") WHERE (deleted_at IS NULL)`,
    );
  }
};
