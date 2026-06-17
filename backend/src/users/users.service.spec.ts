import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  name: 'Test User',
  role: Role.CASHIER,
  isActive: true,
  refreshTokenHash: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  transactions: [],
  inventoryLogs: [],
} as unknown as User;

const mockPaginatedResult = {
  data: [mockUser],
  meta: {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Partial<Repository<User>>>;

  const mockRepo = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users without filters', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockPaginatedResult);
      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by search term', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ page: 1, limit: 10, search: 'test' });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: Like('%test%') },
        }),
      );
    });

    it('should filter by role and isActive', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({
        page: 1,
        limit: 10,
        role: Role.ADMIN,
        isActive: true,
      });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: Role.ADMIN, isActive: true },
        }),
      );
    });

    it('should apply sort order', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'email',
        sortOrder: 'ASC',
      });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { email: 'ASC' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: Role.CASHIER,
    };

    it('should create a user with hashed password', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockRepo.create.mockReturnValue({ ...mockUser, email: createDto.email });
      mockRepo.save.mockResolvedValue({ ...mockUser, email: createDto.email });

      const result = await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockRepo.create).toHaveBeenCalledWith({
        ...createDto,
        passwordHash: 'hashed-password',
      });
      expect(result.email).toBe('new@example.com');
    });

    it('should throw ConflictException when email exists', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update user properties', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockRepo.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      mockRepo.softRemove.mockResolvedValue(undefined);

      await service.remove(mockUser.id);

      expect(mockRepo.softRemove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
