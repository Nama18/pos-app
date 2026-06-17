import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionItem } from './entities/transaction-item.entity';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemsRepository: Repository<TransactionItem>,
  ) {}

  async findAll(query: TransactionQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { sortBy, sortOrder, startDate, endDate, paymentMethod, paymentStatus, customerId, userId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (userId) {
      where.userId = userId;
    }

    const [data, total] = await this.transactionsRepository.findAndCount({
      where,
      relations: ['customer', 'user'],
      skip,
      take: limit,
      order: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'customer', 'user'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }

    return transaction;
  }

  async getReceipt(id: string) {
    const transaction = await this.findById(id);

    return {
      invoiceNo: transaction.invoiceNo,
      date: transaction.createdAt,
      customerName: transaction.customer?.name ?? null,
      cashierName: transaction.user?.name ?? null,
      items: transaction.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name ?? 'Unknown',
        productSku: item.product?.sku ?? 'Unknown',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      subtotal: transaction.subtotal,
      discountType: transaction.discountType,
      discountValue: transaction.discountValue,
      discountAmount: transaction.discountAmount,
      taxRate: transaction.taxRate,
      taxAmount: transaction.taxAmount,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      paymentStatus: transaction.paymentStatus,
      notes: transaction.notes,
    };
  }
}
