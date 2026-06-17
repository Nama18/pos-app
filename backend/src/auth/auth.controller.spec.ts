import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';

describe('AuthController (unit)', () => {
  let app: INestApplication;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockGuard = {
    canActivate: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return 201', async () => {
      mockGuard.canActivate.mockResolvedValue(true);
      const responseBody = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'new@example.com',
          name: 'New User',
          role: 'Cashier',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };
      mockAuthService.register.mockResolvedValue(responseBody);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new@example.com', password: 'password123', name: 'New User' })
        .expect(201);

      expect(res.body).toEqual(responseBody);
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return 200 with tokens', async () => {
      mockGuard.canActivate.mockResolvedValue(true);

      const responseBody = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User',
          role: 'Cashier',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };
      mockAuthService.login.mockResolvedValue(responseBody);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(res.body.accessToken).toBe('mock-access-token');
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token and return 200', async () => {
      mockGuard.canActivate.mockResolvedValue(true);
      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(res.body.accessToken).toBe('new-access-token');
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith({
        refreshToken: 'valid-refresh-token',
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and return 200', async () => {
      const mockReqUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };
      mockGuard.canActivate.mockImplementation(async (context) => {
        const req = context.switchToHttp().getRequest();
        req.user = mockReqUser;
        return true;
      });
      mockAuthService.logout.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);

      expect(mockAuthService.logout).toHaveBeenCalledWith(mockReqUser.id);
    });
  });
});
