import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { InventoryLog, InventoryType } from './entities/inventory.entity';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { AdjustDto } from './dto/adjust.dto';
import { PaginationDto, PaginationResult } from '../common/dto/pagination.dto';

export interface InventoryQueryDto extends PaginationDto {
  productId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryLog)
    private readonly inventoryLogRepo: Repository<InventoryLog>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async stockIn(dto: StockInDto, userId: string): Promise<InventoryLog> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      product.stock += dto.quantity;
      await queryRunner.manager.save(product);

      const log = queryRunner.manager.create(InventoryLog, {
        productId: dto.productId,
        type: InventoryType.IN,
        quantity: dto.quantity,
        reference: dto.reference,
        notes: dto.notes,
        userId,
      });
      const savedLog = await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();

      return this.inventoryLogRepo.findOneOrFail({
        where: { id: savedLog.id },
        relations: ['product'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async stockOut(dto: StockOutDto, userId: string): Promise<InventoryLog> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stock < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, requested: ${dto.quantity}`,
        );
      }

      product.stock -= dto.quantity;
      await queryRunner.manager.save(product);

      const log = queryRunner.manager.create(InventoryLog, {
        productId: dto.productId,
        type: InventoryType.OUT,
        quantity: dto.quantity,
        reference: dto.reference,
        notes: dto.notes,
        userId,
      });
      const savedLog = await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();

      return this.inventoryLogRepo.findOneOrFail({
        where: { id: savedLog.id },
        relations: ['product'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async adjust(dto: AdjustDto, userId: string): Promise<InventoryLog> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      product.stock += dto.quantity;
      await queryRunner.manager.save(product);

      const log = queryRunner.manager.create(InventoryLog, {
        productId: dto.productId,
        type: InventoryType.ADJUSTMENT,
        quantity: dto.quantity,
        reference: dto.reason,
        notes: dto.notes,
        userId,
      });
      const savedLog = await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();

      return this.inventoryLogRepo.findOneOrFail({
        where: { id: savedLog.id },
        relations: ['product'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: InventoryQueryDto,
  ): Promise<PaginationResult<InventoryLog>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      productId,
      type,
      startDate,
      endDate,
    } = query;

    const qb = this.inventoryLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.product', 'product')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`log.${sortBy}`, sortOrder);

    if (productId) {
      qb.andWhere('log.productId = :productId', { productId });
    }

    if (type) {
      qb.andWhere('log.type = :type', { type });
    }

    if (startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate });
    }

    const [data, total] = await qb.getManyAndCount();

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

  async getLowStock(): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .where('product.stock <= product.minStock')
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getMany();
  }
}
