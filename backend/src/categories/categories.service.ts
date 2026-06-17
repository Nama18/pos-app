import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
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
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = generateSlug(dto.name);

    const existing = await this.categoryRepository.findOne({
      where: { slug },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    const category = this.categoryRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
    });

    return this.categoryRepository.save(category);
  }

  async findAll(
    query: PaginationDto & { search?: string; isActive?: string },
  ): Promise<PaginationResult<Category>> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC', search, isActive } = query;

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.productCount', 'category.products', 'product', (qb) =>
        qb.andWhere('product.isActive = :active', { active: true }),
      )
      .take(limit)
      .skip((page - 1) * limit)
      .orderBy(`category.${sortBy}`, sortOrder);

    if (search) {
      queryBuilder.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    }

    if (isActive !== undefined) {
      const isActiveBool = isActive === 'true';
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: isActiveBool });
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

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.productCount', 'category.products', 'product', (qb) =>
        qb.andWhere('product.isActive = :active', { active: true }),
      )
      .where('category.id = :id', { id })
      .getOne();

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    if (dto.name && dto.name !== category.name) {
      const slug = generateSlug(dto.name);
      const existing = await this.categoryRepository.findOne({
        where: { slug },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Category with slug "${slug}" already exists`);
      }
      category.slug = slug;
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    const hasActiveProducts = category.products?.some((p) => p.isActive);
    if (hasActiveProducts) {
      throw new BadRequestException(
        'Cannot delete category with active products. Deactivate or reassign products first.',
      );
    }

    await this.categoryRepository.softRemove(category);
  }
}
