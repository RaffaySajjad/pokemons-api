import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(async () => {
    const mockJwtService: Partial<jest.Mocked<JwtService>> = {
      verifyAsync: jest.fn(),
    };

    const mockReflector: Partial<Reflector> = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
  });

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
      const context = createMockExecutionContext({
        authorizationHeader: '',
      });
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      const context = createMockExecutionContext({
        authorizationHeader: '',
      });
      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should throw UnauthorizedException if the token is invalid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error());
      const context = createMockExecutionContext({
        authorizationHeader: 'Bearer invalidtoken',
      });
      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should allow access if the token is valid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        userId: 1,
        username: 'user',
      });
      const context = createMockExecutionContext({
        authorizationHeader: 'Bearer validtoken',
      });
      expect(await guard.canActivate(context)).toBe(true);
    });
  });

  function createMockExecutionContext({
    authorizationHeader,
  }): ExecutionContext & { isPublic: boolean; authorizationHeader: string } {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: { authorization: authorizationHeader },
        }),
      }),
      isPublic: false,
      authorizationHeader,
    };
  }
});
