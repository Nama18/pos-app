import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';

const mockCategory = {
  id: 'cat-uuid-1',
  name: 'Beverages',
  slug: 'beverages',
  description: null,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  products: [],
} as unknown as Category;

const mockProduct = {
  id: 'prod-uuid-1',
  sku: 'SKU-001',
  barcode: '8999999999999',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product',
  purchasePrice: 5000,
  sellingPrice: 7500,
  stock: 100,
  minStock: 10,
  image: null,
  isActive: true,
  categoryId: mockCategory.id,
  category: mockCategory,
  transactionItems: [],
  inventoryLogs: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
} as unknown as Product;

function createMockQueryBuilder(overrides: Record<string, any> = {}) {
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
    ...overrides,
  };
  return qb;
}

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: any;
  let categoryRepo: any;

  const mockProductRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCategoryRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get(getRepositoryToken(Product));
    categoryRepo = module.get(getRepositoryToken(Category));
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      sku: 'SKU-002',
      barcode: '8999999999998',
      name: 'New Product',
      purchasePrice: 10000,
      sellingPrice: 15000,
      stock: 50,
      minStock: 5,
      categoryId: mockCategory.id,
      description: 'A new product',
    };

    it('should create a product with auto-generated slug', async () => {
      mockCategoryRepo.findOne.mockResolvedValue(mockCategory);
      mockProductRepo.findOne.mockResolvedValue(null);
      mockProductRepo.create.mockReturnValue({
        ...mockProduct,
        sku: createDto.sku,
        name: createDto.name,
        slug: 'new-product',
      });
      mockProductRepo.save.mockResolvedValue({
        ...mockProduct,
        sku: createDto.sku,
        name: createDto.name,
        slug: 'new-product',
      });

      const result = await service.create(createDto);

      expect(mockProductRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sku: 'SKU-002',
          slug: 'new-product',
          name: 'New Product',
        }),
      );
      expect(result.slug).toBe('new-product');
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockCategoryRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when SKU already exists', async () => {
      mockCategoryRepo.findOne.mockResolvedValue(mockCategory);
      mockProductRepo.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when barcode already exists', async () => {
      mockCategoryRepo.findOne.mockResolvedValue(mockCategory);
      mockProductRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProduct);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products without filters', async () => {
      const qb = createMockQueryBuilder();
      mockProductRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'product.category',
        'category',
      );
    });

    it('should filter by search term', async () => {
      const qb = createMockQueryBuilder();
      mockProductRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, search: 'test' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('should filter by categoryId', async () => {
      const qb = createMockQueryBuilder();
      mockProductRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({
        page: 1,
        limit: 10,
        categoryId: mockCategory.id,
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'product.categoryId = :categoryId',
        { categoryId: mockCategory.id },
      );
    });

    it('should filter by barcode', async () => {
      const qb = createMockQueryBuilder();
      mockProductRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, barcode: '8999999999999' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'product.barcode = :barcode',
        { barcode: '8999999999999' },
      );
    });
  });

  describe('findByBarcode', () => {
    it('should return a product when barcode exists', async () => {
      mockProductRepo.findOne.mockResolvedValue(mockProduct);

      const result = await service.findByBarcode('8999999999999');

      expect(result).toEqual(mockProduct);
      expect(mockProductRepo.findOne).toHaveBeenCalledWith({
        where: { barcode: '8999999999999' },
        relations: ['category'],
      });
    });

    it('should throw NotFoundException when barcode not found', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(service.findByBarcode('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      mockProductRepo.findOne.mockResolvedValue(mockProduct);

      const result = await service.findById(mockProduct.id);

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      mockProductRepo.findOne.mockResolvedValue(mockProduct);
      mockProductRepo.softRemove.mockResolvedValue(undefined);

      await service.remove(mockProduct.id);

      expect(mockProductRepo.softRemove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
