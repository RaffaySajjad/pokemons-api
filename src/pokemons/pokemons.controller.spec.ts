import { Test, TestingModule } from '@nestjs/testing';
import { PokemonsController } from './pokemons.controller';
import { PokemonsService } from './pokemons.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { NotFoundException } from '@nestjs/common';

const mockPokemonsService = {
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  getWeaknessAndResistance: jest.fn(),
  delete: jest.fn(),
  simulateBattle: jest.fn(),
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

  // Create Pokemon
  describe('createPokemon', () => {
    it('should successfully create a pokemon', async () => {
      const dto = new CreatePokemonDto();
      const result = {}; // expected result
      mockPokemonsService.create.mockResolvedValue(result);

      expect(await controller.createPokemon(null, dto)).toBe(result);
      expect(mockPokemonsService.create).toHaveBeenCalledWith(dto);
    });
  });

  // Update Pokemon
  describe('updatePokemon', () => {
    it('should update a pokemon successfully', async () => {
      const id = '1';
      const dto = new UpdatePokemonDto();
      const result = {};
      mockPokemonsService.update.mockResolvedValue(result);

      expect(await controller.updatePokemon(id, dto)).toBe(result);
      expect(mockPokemonsService.update).toHaveBeenCalledWith(id, dto);
    });
  });

  // Get All Pokemons
  describe('getAllPokemons', () => {
    it('should return an array of pokemons', async () => {
      const limit = 10;
      const offset = 0;
      const result = [];
      mockPokemonsService.findAll.mockResolvedValue(result);

      expect(await controller.getAllPokemons(limit, offset)).toBe(result);
      expect(mockPokemonsService.findAll).toHaveBeenCalledWith(limit, offset);
    });
  });

  // Get Pokemon by ID or Name
  describe('getPokemon', () => {
    it('should throw NotFoundException if neither id nor name is provided', async () => {
      try {
        await controller.getPokemon('', '');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.response.message).toEqual(
          'Query parameter id or name must be provided',
        );
        expect(error.response.statusCode).toEqual(404);
      }
    });

    it('should retrieve a pokemon by id', async () => {
      const id = '1';
      const result = {};
      mockPokemonsService.findOne.mockResolvedValue(result);

      expect(await controller.getPokemon(id, '')).toBe(result);
      expect(mockPokemonsService.findOne).toHaveBeenCalledWith({ id });
    });

    it('should retrieve a pokemon by name', async () => {
      const name = 'Pikachu';
      const result = {};
      mockPokemonsService.findOne.mockResolvedValue(result);

      expect(await controller.getPokemon('', name)).toBe(result);
      expect(mockPokemonsService.findOne).toHaveBeenCalledWith({ name });
    });
  });

  // Get Weakness and Resistance
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

  // Delete Pokemon
  describe('deletePokemon', () => {
    it('should delete a pokemon successfully', async () => {
      const id = '1';
      mockPokemonsService.delete.mockResolvedValue(undefined);

      await expect(controller.deletePokemon(id)).resolves.toBeUndefined();
      expect(mockPokemonsService.delete).toHaveBeenCalledWith(id);
    });
  });

  // Simulate Battle
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
