import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.enum';

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

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Partial<Repository<User>>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  const mockUsersRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: Role.CASHIER,
    };

    it('should register a new user and return tokens', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUsersRepo.create.mockReturnValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });
      mockUsersRepo.save.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });
      mockConfigService.get.mockImplementation((key: string, fallback?: string) => {
        const map: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_ACCESS_EXPIRES: '15m',
          JWT_REFRESH_EXPIRES: '7d',
        };
        return map[key] ?? fallback;
      });
      mockJwtService.sign.mockReturnValue('mock-token');
      mockUsersRepo.update.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockUsersRepo.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: 'hashed-password',
        name: registerDto.name,
        role: registerDto.role,
      });
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user.email).toBe('new@example.com');
    });

    it('should throw ConflictException when email already registered', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return tokens for valid credentials', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockConfigService.get.mockImplementation((key: string, fallback?: string) => {
        const map: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_ACCESS_EXPIRES: '15m',
          JWT_REFRESH_EXPIRES: '7d',
        };
        return map[key] ?? fallback;
      });
      mockJwtService.sign.mockReturnValue('mock-token');
      mockUsersRepo.update.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshDto = { refreshToken: 'valid-refresh-token' };

    it('should return new access token for valid refresh token', async () => {
      const decodedPayload = { sub: mockUser.id, email: mockUser.email };
      mockJwtService.verify.mockReturnValue(decodedPayload);
      mockUsersRepo.findOne.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'stored-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockConfigService.get.mockImplementation((key: string, fallback?: string) => {
        const map: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_ACCESS_EXPIRES: '15m',
        };
        return map[key] ?? fallback;
      });
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken(refreshDto);

      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user has no stored refresh token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: mockUser.id });
      mockUsersRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when refresh token does not match hash', async () => {
      mockJwtService.verify.mockReturnValue({ sub: mockUser.id });
      mockUsersRepo.findOne.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'stored-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear the refresh token hash', async () => {
      mockUsersRepo.update.mockResolvedValue(undefined);

      await service.logout(mockUser.id);

      expect(mockUsersRepo.update).toHaveBeenCalledWith(mockUser.id, {
        refreshTokenHash: null,
      });
    });
  });
});
