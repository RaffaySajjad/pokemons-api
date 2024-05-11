import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn((username) => {
        if (username === 'raffay') {
          return Promise.resolve({
            userId: 1,
            username: 'raffay',
            password: 'password',
          });
        }
        return null;
      }),
    };

    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return a valid token for correct credentials', async () => {
      const result = await service.signIn('raffay', 'password');
      expect(result).toEqual({ access_token: 'token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        username: 'raffay',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      await expect(service.signIn('raffay', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existing user', async () => {
      await expect(
        service.signIn('nonexistinguser', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
