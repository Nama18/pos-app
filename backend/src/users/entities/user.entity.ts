import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from './role.enum';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { InventoryLog } from '../../inventory/entities/inventory.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash', nullable: false })
  passwordHash: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'enum', enum: Role, default: Role.CASHIER })
  role: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Exclude()
  @Column({ name: 'refresh_token_hash', type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => InventoryLog, (inventoryLog) => inventoryLog.user)
  inventoryLogs: InventoryLog[];
}
