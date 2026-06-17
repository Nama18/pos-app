import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionItem } from '../transactions/entities/transaction-item.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { InventoryLog } from '../inventory/entities/inventory.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { DateRangeDto } from '../reports/dto/date-range.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(InventoryLog)
    private readonly inventoryLogRepo: Repository<InventoryLog>,
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todaySalesResult, totalProducts, lowStockCount, totalCustomers, totalRevenueResult] =
      await Promise.all([
        this.transactionRepo
          .createQueryBuilder('t')
          .select('COALESCE(SUM(t.total), 0)', 'total')
          .where('t.paymentStatus = :status', { status: 'paid' })
          .andWhere('t.createdAt BETWEEN :start AND :end', {
            start: todayStart,
            end: todayEnd,
          })
          .getRawOne(),
        this.productRepo.count(),
        this.productRepo
          .createQueryBuilder('p')
          .where('p.stock <= p.minStock')
          .andWhere('p.isActive = :isActive', { isActive: true })
          .getCount(),
        this.customerRepo.count(),
        this.transactionRepo
          .createQueryBuilder('t')
          .select('COALESCE(SUM(t.total), 0)', 'total')
          .where('t.paymentStatus = :status', { status: 'paid' })
          .getRawOne(),
      ]);

    const todayTransactions = await this.transactionRepo
      .createQueryBuilder('t')
      .where('t.paymentStatus = :status', { status: 'paid' })
      .andWhere('t.createdAt BETWEEN :start AND :end', {
        start: todayStart,
        end: todayEnd,
      })
      .getCount();

    return {
      todaySales: parseFloat(todaySalesResult.total) || 0,
      todayTransactions,
      totalProducts,
      lowStockCount,
      totalCustomers,
      totalRevenue: parseFloat(totalRevenueResult.total) || 0,
    };
  }

  async getSalesChart(dto: DateRangeDto) {
    const { startDate, endDate } = dto;

    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .select([
        "TO_CHAR(t.createdAt, 'YYYY-MM-DD') AS date",
        'COALESCE(SUM(t.total), 0) AS total',
        'COUNT(t.id) AS count',
      ])
      .where('t.paymentStatus = :status', { status: 'paid' });

    if (startDate) {
      qb.andWhere('t.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('t.createdAt <= :endDate', { endDate });
    }

    const raw = await qb
      .groupBy("TO_CHAR(t.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return raw.map((r: any) => ({
      date: r.date,
      total: parseFloat(r.total) || 0,
      count: parseInt(r.count, 10) || 0,
    }));
  }

  async getRecentTransactions(limit: number = 10) {
    return this.transactionRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('t.user', 'user')
      .leftJoinAndSelect('t.customer', 'customer')
      .orderBy('t.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getLowStockAlerts() {
    return this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.stock <= p.minStock')
      .andWhere('p.isActive = :isActive', { isActive: true })
      .orderBy('p.stock', 'ASC')
      .getMany();
  }
}
