import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto, PaginationResult } from '../common/dto/pagination.dto';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with ID "${dto.categoryId}" not found`,
      );
    }

    const existingSku = await this.productRepository.findOne({
      where: { sku: dto.sku },
      withDeleted: true,
    });
    if (existingSku) {
      throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
    }

    if (dto.barcode) {
      const existingBarcode = await this.productRepository.findOne({
        where: { barcode: dto.barcode },
        withDeleted: true,
      });
      if (existingBarcode) {
        throw new ConflictException(
          `Product with barcode "${dto.barcode}" already exists`,
        );
      }
    }

    const slug = generateSlug(dto.name);
    const existingSlug = await this.productRepository.findOne({
      where: { slug },
      withDeleted: true,
    });
    if (existingSlug) {
      throw new ConflictException(`Product with slug "${slug}" already exists`);
    }

    const product = this.productRepository.create({
      sku: dto.sku,
      barcode: dto.barcode,
      name: dto.name,
      slug,
      description: dto.description,
      purchasePrice: dto.purchasePrice,
      sellingPrice: dto.sellingPrice,
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 0,
      image: dto.image,
      categoryId: dto.categoryId,
    });

    return this.productRepository.save(product);
  }

  async findAll(
    query: PaginationDto & {
      search?: string;
      categoryId?: string;
      isActive?: string;
      minStock?: string;
      barcode?: string;
    },
  ): Promise<PaginationResult<Product>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'ASC',
      search,
      categoryId,
      isActive,
      minStock,
      barcode,
    } = query;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .take(limit)
      .skip((page - 1) * limit)
      .orderBy(`product.${sortBy}`, sortOrder);

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (isActive !== undefined) {
      const isActiveBool = isActive === 'true';
      queryBuilder.andWhere('product.isActive = :isActive', { isActive: isActiveBool });
    }

    if (minStock !== undefined) {
      queryBuilder.andWhere('product.stock <= product.minStock');
    }

    if (barcode) {
      queryBuilder.andWhere('product.barcode = :barcode', { barcode });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async findByBarcode(barcode: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { barcode },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(
        `Product with barcode "${barcode}" not found`,
      );
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productRepository.findOne({
        where: { sku: dto.sku },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
      }
    }

    if (dto.barcode && dto.barcode !== product.barcode) {
      const existing = await this.productRepository.findOne({
        where: { barcode: dto.barcode },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Product with barcode "${dto.barcode}" already exists`,
        );
      }
    }

    if (dto.name && dto.name !== product.name) {
      const slug = generateSlug(dto.name);
      const existing = await this.productRepository.findOne({
        where: { slug },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Product with slug "${slug}" already exists`);
      }
      product.slug = slug;
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID "${dto.categoryId}" not found`,
        );
      }
    }

    Object.assign(product, dto);

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    await this.productRepository.softRemove(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    product.stock += quantity;

    if (product.stock < 0) {
      throw new ConflictException(
        `Insufficient stock for product "${product.name}". Available: ${product.stock - quantity}, Requested: ${quantity}`,
      );
    }

    return this.productRepository.save(product);
  }

  async checkLowStock(): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.stock <= product.minStock')
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getMany();
  }
}
