import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let mockResponse: Response;

  beforeEach(async () => {
    const mockAuthService = {
      signIn: jest.fn(() => {
        return Promise.resolve({ access_token: 'fake_access_token' });
      }),
    };

    mockResponse = {
      cookie: jest.fn(),
      json: jest.fn(),
      // Type cast to avoid TypeScript errors due to missing properties
    } as unknown as Response;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should call AuthService.signIn with correct parameters', async () => {
      const signInDto = { username: 'user', password: 'pass' };
      await controller.signIn(signInDto, mockResponse);
      expect(authService.signIn).toHaveBeenCalledWith('user', 'pass');
    });

    it('should set cookie and return the token', async () => {
      const signInDto = { username: 'user', password: 'pass' };
      await controller.signIn(signInDto, mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'fake_access_token',
        {
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
        },
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        access_token: 'fake_access_token',
      });
    });
  });
});
