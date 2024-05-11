import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Readable } from 'stream';
import { S3Service } from '../s3/s3.service';
import { Pokemon } from './entity/pokemon.entity';
import { PokemonsService } from './pokemons.service';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  preload: jest.fn(),
};

const mockS3Service = {
  uploadFileToS3: jest.fn().mockResolvedValue('image-url'),
};

const createPokemonDto = {
  name: 'Pikachu',
  health: 200,
  attack: {
    name: 'THUNDER_SHOCK',
    damage: 10,
  },
  weakness: {
    name: 'FIRE_BLAST',
    multiplier: 2,
  },
  filePath: 'image-url',
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
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<PokemonsService>(PokemonsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should validate and upload an image, then save a new Pokemon', async () => {
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
      mockS3Service.uploadFileToS3.mockResolvedValue('image-url');
      mockRepository.create.mockReturnValue(createPokemonDto);
      mockRepository.save.mockResolvedValue({
        ...createPokemonDto,
        id: 1,
        filePath: 'image-url',
      });

      const result = await service.create(createPokemonDto, mockFile);
      expect(mockS3Service.uploadFileToS3).toHaveBeenCalledWith(mockFile);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createPokemonDto,
        filePath: 'image-url',
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createPokemonDto,
        filePath: 'image-url',
      });
      expect(result).toEqual({
        ...createPokemonDto,
        id: 1,
        filePath: 'image-url',
      });
    });

    it('should throw BadRequestException if file is not an image', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'pokemon.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 500000,
        stream: new Readable(),
        destination: './uploads',
        filename: 'pokemon.txt',
        path: './uploads/pokemon.txt',
        buffer: Buffer.from(''),
      };
      await expect(service.create(createPokemonDto, mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update a Pokemon if found', async () => {
      const updatePokemonDto = { health: 300 };
      mockRepository.findOne.mockResolvedValue({ id: 1, name: 'Pikachu' });
      mockRepository.preload.mockResolvedValue({ ...updatePokemonDto, id: 1 });
      mockRepository.save.mockResolvedValue({ ...updatePokemonDto, id: 1 });

      const result = await service.update('Pikachu', updatePokemonDto);
      expect(mockRepository.preload).toHaveBeenCalledWith({
        id: 1,
        ...updatePokemonDto,
      });
      expect(result).toEqual({ ...updatePokemonDto, id: 1 });
    });

    it('should throw NotFoundException if Pokemon does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.update('Pokemon', { health: 300 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of Pokemons', async () => {
      const pokemonArray = [
        { name: 'Pokemon', health: 300 },
        { name: 'Charmander', health: 250 },
      ];
      mockRepository.find.mockResolvedValue(pokemonArray);

      const result = await service.findAll(10, 0);
      expect(mockRepository.find).toHaveBeenCalledWith({ take: 10, skip: 0 });
      expect(result).toEqual(pokemonArray);
    });
  });

  describe('findOne', () => {
    it('should return a Pokemon by id', async () => {
      const pokemon = { name: 'Pokemon', health: 300 };
      mockRepository.findOne.mockResolvedValue(pokemon);

      const result = await service.findOne({ id: '1' });
      expect(result).toEqual(pokemon);
    });

    it('should throw NotFoundException if Pokemon not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne({ id: '1' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
