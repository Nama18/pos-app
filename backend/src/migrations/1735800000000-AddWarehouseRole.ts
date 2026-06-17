import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWarehouseRole1735800000000 implements MigrationInterface {
  name = 'AddWarehouseRole1735800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "users_role_enum" ADD VALUE 'Warehouse'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing values from an enum directly.
    // A full type recreation would be needed to revert.
  }
}
