import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Transaction, DiscountType, PaymentMethod, PaymentStatus } from '../transactions/entities/transaction.entity';
import { TransactionItem } from '../transactions/entities/transaction-item.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { InventoryLog, InventoryType } from '../inventory/entities/inventory.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PaginationDto, PaginationResult } from '../common/dto/pagination.dto';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemsRepository: Repository<TransactionItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  async createTransaction(
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.productsRepository.find({
      where: { id: In(productIds) },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Products not found: ${missingIds.join(', ')}`);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        );
      }
    }

    const invoiceNo = await this.generateInvoiceNumber();
    const subtotal = dto.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.sellingPrice * item.quantity;
    }, 0);

    let discountAmount = 0;
    if (dto.discountType && dto.discountValue) {
      if (dto.discountType === DiscountType.PERCENTAGE) {
        discountAmount = subtotal * (dto.discountValue / 100);
      } else {
        discountAmount = dto.discountValue;
      }
    }

    const afterDiscount = subtotal - discountAmount;
    const taxRate = dto.taxRate ?? 0;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = queryRunner.manager.create(Transaction, {
        invoiceNo,
        subtotal,
        discountType: dto.discountType ?? undefined,
        discountValue: dto.discountValue ?? 0,
        discountAmount,
        taxRate,
        taxAmount,
        total,
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentStatus ?? PaymentStatus.PAID,
        customerId: dto.customerId ?? undefined,
        userId,
        notes: dto.notes ?? undefined,
      } as any);

      const savedTransaction = await queryRunner.manager.save(transaction);

      const transactionItems: TransactionItem[] = [];
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const unitPrice = product.sellingPrice;
        const itemSubtotal = unitPrice * item.quantity;

        const transactionItem = queryRunner.manager.create(TransactionItem, {
          transactionId: savedTransaction.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          subtotal: itemSubtotal,
        });
        transactionItems.push(transactionItem);
      }

      await queryRunner.manager.save(transactionItems);

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        const inventoryLog = queryRunner.manager.create(InventoryLog, {
          productId: item.productId,
          type: InventoryType.OUT,
          quantity: item.quantity,
          reference: invoiceNo,
          notes: `Sale - ${invoiceNo}`,
          userId,
        });
        await queryRunner.manager.save(inventoryLog);
      }

      if (dto.customerId) {
        const customer = await this.customersRepository.findOneBy({ id: dto.customerId });
        if (customer) {
          const pointsEarned = Math.floor(total);
          customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;
          await queryRunner.manager.save(customer);
        }
      }

      await queryRunner.commitTransaction();

      const result = await this.transactionsRepository.findOne({
        where: { id: savedTransaction.id },
        relations: ['items', 'items.product', 'customer'],
      });
      if (!result) {
        throw new NotFoundException('Transaction not found after creation');
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllTransactions(
    query: PaginationDto,
  ): Promise<PaginationResult<Transaction>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.transactionsRepository.findAndCount({
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

  async getTransaction(id: string): Promise<Transaction> {
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
    const transaction = await this.getTransaction(id);

    return {
      invoiceNo: transaction.invoiceNo,
      date: transaction.createdAt,
      customerName: transaction.customer?.name ?? null,
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
      discountAmount: transaction.discountAmount,
      taxAmount: transaction.taxAmount,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      paymentStatus: transaction.paymentStatus,
    };
  }

  async getPosProducts(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isActive: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const lastTransaction = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.invoiceNo LIKE :pattern', { pattern: `INV-${dateStr}-%` })
      .orderBy('transaction.createdAt', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastTransaction) {
      const parts = lastTransaction.invoiceNo.split('-');
      sequence = parseInt(parts[parts.length - 1], 10) + 1;
    }

    const seqStr = String(sequence).padStart(4, '0');
    return `INV-${dateStr}-${seqStr}`;
  }
}
