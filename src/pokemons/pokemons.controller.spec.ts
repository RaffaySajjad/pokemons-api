import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { PokemonsController } from './pokemons.controller';
import { PokemonsService } from './pokemons.service';

const mockPokemonsService = {
  createPokemon: jest.fn(),
  updatePokemon: jest.fn(),
  getAllPokemons: jest.fn(),
  findPokemonsByCriteria: jest.fn(),
  getWeaknessAndResistance: jest.fn(),
  deletePokemon: jest.fn(),
  simulateBattle: jest.fn(),
};

const mockFile: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'pokemon.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 500000,
  stream: new Readable(),
  destination: './uploads',
  filename: 'pokemon.jpg',
  path: './uploads/pokemon.jpg',
  buffer: Buffer.from(''),
};

describe('PokemonsController', () => {
  let controller: PokemonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PokemonsController],
      providers: [{ provide: PokemonsService, useValue: mockPokemonsService }],
    }).compile();

    controller = module.get<PokemonsController>(PokemonsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPokemon', () => {
    it('should successfully create a pokemon', async () => {
      const dto = new CreatePokemonDto();
      const result = {};
      mockPokemonsService.createPokemon.mockResolvedValue(result);

      expect(await controller.createPokemon(mockFile, dto)).toBe(result);
    });
  });

  describe('updatePokemon', () => {
    it('should update a pokemon successfully', async () => {
      const id = '1';
      const dto = new UpdatePokemonDto();
      const result = {};
      mockPokemonsService.updatePokemon.mockResolvedValue(result);

      expect(await controller.updatePokemon(id, dto)).toBe(result);
      expect(mockPokemonsService.updatePokemon).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('getAllPokemons', () => {
    it('should return an array of pokemons', async () => {
      const limit = '10';
      const offset = '0';
      const result = [];
      mockPokemonsService.getAllPokemons.mockResolvedValue(result);

      expect(await controller.getAllPokemons(limit, offset)).toBe(result);
      expect(mockPokemonsService.getAllPokemons).toHaveBeenCalledWith(
        +limit,
        +offset,
      );
    });
  });

  describe('findPokemonsByCriteria', () => {
    it('should throw NotFoundException if neither id nor name is provided', async () => {
      try {
        await controller.findPokemonsByCriteria('', '', '');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.response.message).toEqual(
          'Query parameter id, name or rarity must be provided',
        );
        expect(error.response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      }
    });

    it('should retrieve a pokemon by id', async () => {
      const id = '1';
      const result = [];
      mockPokemonsService.findPokemonsByCriteria.mockResolvedValue(result);

      expect(await controller.findPokemonsByCriteria(id, '', '')).toBe(result);
      expect(mockPokemonsService.findPokemonsByCriteria).toHaveBeenCalledWith({
        id,
      });
    });

    it('should retrieve a pokemon by name', async () => {
      const name = 'Pikachu';
      const result = [];
      mockPokemonsService.findPokemonsByCriteria.mockResolvedValue(result);

      expect(await controller.findPokemonsByCriteria('', name, '')).toBe(
        result,
      );
      expect(mockPokemonsService.findPokemonsByCriteria).toHaveBeenCalledWith({
        name,
      });
    });

    it('should retrieve a pokemon by rarity', async () => {
      const rarity = 'RARE';
      const result = [];
      mockPokemonsService.findPokemonsByCriteria.mockResolvedValue(result);

      expect(await controller.findPokemonsByCriteria('', '', rarity)).toBe(
        result,
      );
      expect(mockPokemonsService.findPokemonsByCriteria).toHaveBeenCalledWith({
        rarity,
      });
    });
  });

  describe('getWeaknessAndResistance', () => {
    it('should return weaknesses and resistances', async () => {
      const id = '1';
      const result = { weaknesses: ['Fire'], resistances: ['Water'] };
      mockPokemonsService.getWeaknessAndResistance.mockResolvedValue(result);

      expect(await controller.getWeaknessAndResistance(id)).toBe(result);
      expect(mockPokemonsService.getWeaknessAndResistance).toHaveBeenCalledWith(
        id,
      );
    });
  });

  describe('deletePokemon', () => {
    it('should delete a pokemon successfully', async () => {
      const id = '1';
      mockPokemonsService.deletePokemon.mockResolvedValue(undefined);

      await expect(controller.deletePokemon(null, id)).resolves.toBeUndefined();
      expect(mockPokemonsService.deletePokemon).toHaveBeenCalled();
    });
  });

  describe('simulateBattle', () => {
    it('should simulate a battle and return a result', async () => {
      const attackerId = '1';
      const defenderId = '2';
      const result = 'Attacker wins';
      mockPokemonsService.simulateBattle.mockResolvedValue(result);

      expect(await controller.simulateBattle(attackerId, defenderId)).toBe(
        result,
      );
      expect(mockPokemonsService.simulateBattle).toHaveBeenCalledWith(
        attackerId,
        defenderId,
      );
    });
  });
});
