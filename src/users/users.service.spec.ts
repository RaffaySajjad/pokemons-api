import { Test, TestingModule } from '@nestjs/testing';
import { UsersService, User } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user if the username matches', async () => {
      const username = 'raffay';
      const expectedUser: User = {
        userId: 1,
        username: 'raffay',
        password: 'password',
      };
      const user = await service.findOne(username);
      expect(user).toBeDefined();
      expect(user).toEqual(expectedUser);
    });

    it('should return undefined if the username does not match any user', async () => {
      const username = 'john';
      const user = await service.findOne(username);
      expect(user).toBeUndefined();
    });
  });
});
