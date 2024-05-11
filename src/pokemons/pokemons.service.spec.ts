import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entity/pokemon.entity';
import { PokemonsService } from './pokemons.service';
import { MOVES } from './constants';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  preload: jest.fn(),
};

describe('PokemonsService', () => {
  let service: PokemonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonsService,
        {
          provide: getRepositoryToken(Pokemon),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PokemonsService>(PokemonsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('create', () => {
    it('should successfully create a pokemon', async () => {
      const dto = new CreatePokemonDto();
      const expectedPokemon = { ...dto, id: 1 };
      mockRepository.create.mockImplementation(() => dto);
      mockRepository.save.mockResolvedValue(expectedPokemon);

      await expect(service.create(dto, null)).resolves.toEqual(expectedPokemon);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if pokemon not found', async () => {
      mockRepository.preload = jest.fn().mockResolvedValue(undefined);
      await expect(service.update('1', new UpdatePokemonDto())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update pokemon if found', async () => {
      const pokemon = new Pokemon();
      const dto = new UpdatePokemonDto();
      mockRepository.preload.mockResolvedValue(pokemon);
      mockRepository.save.mockResolvedValue(pokemon);

      await expect(service.update('1', dto)).resolves.toEqual(pokemon);
      expect(mockRepository.save).toHaveBeenCalledWith(pokemon);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if pokemon not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne({ id: '1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the pokemon if found', async () => {
      const pokemon = new Pokemon();
      mockRepository.findOne.mockResolvedValueOnce(pokemon);
      await expect(service.findOne({ id: '1' })).resolves.toEqual(pokemon);
    });
  });

  describe('findAll', () => {
    it('should return all pokemons', async () => {
      const pokemons = [new Pokemon(), new Pokemon()];
      mockRepository.find.mockResolvedValue(pokemons);

      await expect(service.findAll(10, 0)).resolves.toEqual(pokemons);
      expect(mockRepository.find).toHaveBeenCalledWith({ take: 10, skip: 0 });
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if pokemon not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.delete('1')).rejects.toThrow(NotFoundException);
    });

    it('should delete the pokemon if found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(new Pokemon());
      await service.delete('1');
      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('simulateBattle', () => {
    it('should correctly simulate a battle', async () => {
      const attacker = {
        id: 1,
        name: 'Charizard',
        attack: { name: MOVES.FIRE_BLAST, damage: 120 },
        weakness: { name: MOVES.GIANT_WAVE, multiplier: 2 },
      };
      const defender = {
        id: 2,
        name: 'Feraligatr',
        health: 180,
        attack: { name: MOVES.GIANT_WAVE, damage: 160 },
        weakness: { name: MOVES.GNAW, multiplier: 2 },
      };
      mockRepository.findOne
        .mockResolvedValueOnce(attacker)
        .mockResolvedValueOnce(defender);

      const expectedWinner = {
        id: defender.id,
        name: defender.name,
        message: `${defender.name} won the battle`,
      };

      const result = await service.simulateBattle('1', '2');
      expect(result).toEqual(expectedWinner);
    });

    it('should throw NotFoundException if attacker not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.simulateBattle('1', '2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if defender not found', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(new Pokemon())
        .mockResolvedValueOnce(null);
      await expect(service.simulateBattle('1', '2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
