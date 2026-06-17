import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddSettingsTable1735700000000 implements MigrationInterface {
  name = 'AddSettingsTable1735700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'settings',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'key', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'value', type: 'text', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('settings');
  }
}
