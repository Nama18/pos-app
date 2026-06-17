import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class InitialSchema1734567890123 implements MigrationInterface {
  name = 'InitialSchema1734567890123';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'password_hash', type: 'varchar', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'role', type: 'enum', enum: ['Admin', 'Cashier'], default: "'Cashier'" },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'refresh_token_hash', type: 'varchar', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Create categories table
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'slug', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Create products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'sku', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'barcode', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'slug', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'purchase_price', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'selling_price', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'stock', type: 'integer', default: 0 },
          { name: 'min_stock', type: 'integer', default: 0 },
          { name: 'image', type: 'varchar', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'category_id', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Create customers table
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'email', type: 'varchar', isNullable: true },
          { name: 'phone', type: 'varchar', isNullable: true },
          { name: 'address', type: 'text', isNullable: true },
          { name: 'loyalty_points', type: 'integer', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Create transactions table
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'invoice_no', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'subtotal', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'discount_type', type: 'enum', enum: ['percentage', 'fixed'], isNullable: true },
          { name: 'discount_value', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 },
          { name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'total', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'payment_method', type: 'enum', enum: ['cash', 'card', 'qris', 'ewallet', 'transfer'] },
          { name: 'payment_status', type: 'enum', enum: ['paid', 'pending', 'cancelled'], default: "'paid'" },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'customer_id', type: 'uuid', isNullable: true },
          { name: 'user_id', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Create transaction_items table
    await queryRunner.createTable(
      new Table({
        name: 'transaction_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'transaction_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'quantity', type: 'integer' },
          { name: 'unit_price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'subtotal', type: 'decimal', precision: 10, scale: 2 },
        ],
      }),
      true,
    );

    // Create inventory_logs table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'product_id', type: 'uuid' },
          { name: 'type', type: 'enum', enum: ['in', 'out', 'adjustment'] },
          { name: 'quantity', type: 'integer' },
          { name: 'reference', type: 'varchar', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'user_id', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'transaction_items',
      new TableForeignKey({
        columnNames: ['transaction_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'transactions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'transaction_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inventory_logs',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inventory_logs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex('users', new TableIndex({ columnNames: ['email'] }));
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['category_id'] }));
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['barcode'] }));
    await queryRunner.createIndex('transactions', new TableIndex({ columnNames: ['invoice_no'] }));
    await queryRunner.createIndex('transactions', new TableIndex({ columnNames: ['user_id'] }));
    await queryRunner.createIndex('transactions', new TableIndex({ columnNames: ['customer_id'] }));
    await queryRunner.createIndex('transactions', new TableIndex({ columnNames: ['created_at'] }));
    await queryRunner.createIndex('transaction_items', new TableIndex({ columnNames: ['transaction_id'] }));
    await queryRunner.createIndex('inventory_logs', new TableIndex({ columnNames: ['product_id'] }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inventory_logs');
    await queryRunner.dropTable('transaction_items');
    await queryRunner.dropTable('transactions');
    await queryRunner.dropTable('customers');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('categories');
    await queryRunner.dropTable('users');
  }
}
