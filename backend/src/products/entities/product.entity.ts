import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { TransactionItem } from '../../transactions/entities/transaction-item.entity';
import { InventoryLog } from '../../inventory/entities/inventory.entity';

class DecimalColumnTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  sku: string;

  @Column({ unique: true, nullable: true })
  barcode: string;

  @Column({ nullable: false })
  name: string;

  @Column({ unique: true, nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'purchase_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  purchasePrice: number;

  @Column({
    name: 'selling_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  sellingPrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ name: 'min_stock', default: 0 })
  minStock: number;

  @Column({ nullable: true })
  image: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => TransactionItem, (transactionItem) => transactionItem.product)
  transactionItems: TransactionItem[];

  @OneToMany(() => InventoryLog, (inventoryLog) => inventoryLog.product)
  inventoryLogs: InventoryLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
