import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, PaymentMethod } from '../transactions/entities/transaction.entity';
import { TransactionItem } from '../transactions/entities/transaction-item.entity';
import { Product } from '../products/entities/product.entity';
import { SalesReportDto } from './dto/sales-report.dto';
import { DateRangeDto } from './dto/date-range.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  private nextDay(date: string): string {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  async getSalesReport(query: SalesReportDto) {
    const { startDate, endDate, groupBy = 'day', paymentMethod } = query;

    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .select([
        `DATE_TRUNC(:groupBy, t.createdAt) AS period`,
        'SUM(t.total) AS total',
        'COUNT(t.id) AS count',
        'AVG(t.total) AS average',
      ])
      .where('t.paymentStatus = :status', { status: 'paid' })
      .setParameter('groupBy', groupBy);

    if (startDate) {
      qb.andWhere('t.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('t.createdAt < :endDatePlusOne', {
        endDatePlusOne: this.nextDay(endDate),
      });
    }

    if (paymentMethod) {
      qb.andWhere('t.paymentMethod = :paymentMethod', { paymentMethod });
    }

    const raw = await qb
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return raw.map((r: any) => ({
      date: r.period,
      total: parseFloat(r.total) || 0,
      count: parseInt(r.count, 10) || 0,
      average: parseFloat(r.average) || 0,
    }));
  }

  async getSalesSummary(query: DateRangeDto) {
    const { startDate, endDate } = query;

    const totalsParams: any[] = ['paid'];
    let totalsSql =
      'SELECT COALESCE(SUM(total), 0) AS "totalSales", COUNT(id) AS "totalTransactions", COALESCE(AVG(total), 0) AS "avgPerTransaction" FROM transactions WHERE payment_status = $1';

    let pmWhere = '';
    let cpWhere = '';

    if (startDate) {
      totalsParams.push(startDate);
      totalsSql += ` AND created_at >= $${totalsParams.length}`;
      pmWhere += ` AND created_at >= $${totalsParams.length}`;
      cpWhere += ` AND t.created_at >= $${totalsParams.length}`;
    }
    if (endDate) {
      totalsParams.push(this.nextDay(endDate));
      totalsSql += ` AND created_at < $${totalsParams.length}`;
      pmWhere += ` AND created_at < $${totalsParams.length}`;
      cpWhere += ` AND t.created_at < $${totalsParams.length}`;
    }

    const pmSql = `SELECT payment_method, COUNT(id) AS count, SUM(total) AS total FROM transactions WHERE payment_status = $1${pmWhere} GROUP BY payment_method ORDER BY COUNT(id) DESC`;
    const cpSql = `SELECT u.id AS "userId", u.name AS "userName", COUNT(t.id) AS "transactionCount", COALESCE(SUM(t.total), 0) AS "totalSales" FROM transactions t LEFT JOIN users u ON u.id = t.user_id WHERE t.payment_status = $1${cpWhere} GROUP BY u.id, u.name ORDER BY "totalSales" DESC`;

    const rawTotals = await this.transactionRepo.query(totalsSql, totalsParams);
    const totals = rawTotals[0];
    const paymentMethods = await this.transactionRepo.query(pmSql, totalsParams);
    const cashierPerformance = await this.transactionRepo.query(cpSql, totalsParams);

    return {
      totalRevenue: parseFloat(totals.totalSales) || 0,
      totalTransactions: parseInt(totals.totalTransactions, 10) || 0,
      avgOrderValue: parseFloat(totals.avgPerTransaction) || 0,
      paymentMethods: paymentMethods.map((pm: any) => ({
        method: pm.payment_method,
        count: parseInt(pm.count, 10) || 0,
        total: parseFloat(pm.total) || 0,
      })),
      cashierPerformance: cashierPerformance.map((cp: any) => ({
        userId: cp.userId,
        userName: cp.userName,
        transactionCount: parseInt(cp.transactionCount, 10) || 0,
        totalSales: parseFloat(cp.totalSales) || 0,
      })),
    };
  }

  async getInventoryReport() {
    const products = await this.productRepo
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c')
      .select([
        'COUNT(p.id) AS "totalProducts"',
        'COALESCE(SUM(p.purchasePrice * p.stock), 0) AS "totalStockValue"',
        'SUM(CASE WHEN p.stock <= p.minStock THEN 1 ELSE 0 END) AS "lowStockCount"',
      ])
      .getRawOne();

    const categoryDistribution = await this.productRepo
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c')
      .select([
        'c.id AS "categoryId"',
        'c.name AS "categoryName"',
        'COUNT(p.id) AS "productCount"',
        'COALESCE(SUM(p.stock), 0) AS "totalStock"',
      ])
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('"productCount"', 'DESC')
      .getRawMany();

    return {
      totalProducts: parseInt(products.totalProducts, 10) || 0,
      totalStockValue: parseFloat(products.totalStockValue) || 0,
      lowStockItems: parseInt(products.lowStockCount, 10) || 0,
      categoryDistribution: categoryDistribution.map((cd: any) => ({
        categoryId: cd.categoryId,
        categoryName: cd.categoryName,
        productCount: parseInt(cd.productCount, 10) || 0,
        totalStock: parseInt(cd.totalStock, 10) || 0,
      })),
    };
  }

  async getTopProducts(query: DateRangeDto) {
    const { startDate, endDate } = query;

    const qb = this.transactionItemRepo
      .createQueryBuilder('ti')
      .leftJoin('ti.product', 'p')
      .leftJoin('ti.transaction', 't')
      .select([
        'p.id AS "productId"',
        'p.name AS "productName"',
        'p.sku AS "productSku"',
        'SUM(ti.quantity) AS "totalQuantity"',
        'COALESCE(SUM(ti.subtotal), 0) AS "totalRevenue"',
      ])
      .where('t.paymentStatus = :status', { status: 'paid' });

    if (startDate) {
      qb.andWhere('t.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('t.createdAt < :endDatePlusOne', {
        endDatePlusOne: this.nextDay(endDate),
      });
    }

    const raw = await qb
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.sku')
      .orderBy('"totalQuantity"', 'DESC')
      .limit(20)
      .getRawMany();

    return raw.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      productSku: r.productSku,
      totalQuantity: parseInt(r.totalQuantity, 10) || 0,
      totalRevenue: parseFloat(r.totalRevenue) || 0,
    }));
  }
}
