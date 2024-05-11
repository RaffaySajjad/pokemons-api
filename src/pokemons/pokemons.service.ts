import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entity/pokemon.entity';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class PokemonsService {
  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    createPokemonDto: CreatePokemonDto,
    file: Express.Multer.File,
  ): Promise<Pokemon> {
    const { name, health, attack, weakness, resistance } = createPokemonDto;
    let url = null;

    if (file) {
      if (!file.mimetype?.includes('image')) {
        throw new BadRequestException('File must be an image');
      }

      if (file.size > 1.5 * 1024 * 1024) {
        throw new BadRequestException('File must be less than 1.5MB');
      }

      url = await this.s3Service.uploadFileToS3(file);
    }

    try {
      const pokemon = this.pokemonRepository.create({
        name,
        health,
        attack,
        weakness,
        resistance,
        filePath: url,
      });
      return this.pokemonRepository.save(pokemon);
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async update(
    name: string,
    updatePokemonDto: UpdatePokemonDto,
  ): Promise<Pokemon> {
    const pokemonToUpdate = await this.pokemonRepository.findOne({
      select: ['id'],
      where: { name },
    });

    if (!pokemonToUpdate) {
      throw new NotFoundException('Pokemon not found');
    }

    const pokemon = await this.pokemonRepository.preload({
      id: pokemonToUpdate.id,
      ...updatePokemonDto,
    });

    return this.pokemonRepository.save(pokemon);
  }

  async findAll(limit: number, offset: number): Promise<Pokemon[]> {
    return this.pokemonRepository.find({
      take: limit,
      skip: offset,
    });
  }

  async findOne(query: { id?: string; name?: string }): Promise<Pokemon> {
    let searchCriteria = {};

    if (query.id) {
      searchCriteria = { id: +query.id };
    } else if (query.name) {
      searchCriteria = { name: query.name };
    }

    const pokemon = await this.pokemonRepository.findOne({
      where: searchCriteria,
    });

    if (!pokemon) {
      throw new NotFoundException('Pokemon not found');
    }

    return pokemon;
  }

  async getWeaknessAndResistance(name: string): Promise<{
    weaknesses: string[];
    resistances: string[];
  }> {
    const pokemon = await this.pokemonRepository.findOne({
      select: ['weakness', 'resistance'],
      where: { name },
    });

    console.log('NAME:', name, pokemon);

    if (!pokemon) {
      throw new NotFoundException('Pokemon not found');
    }

    const weakAgainst = await this.pokemonRepository
      .createQueryBuilder('pokemon')
      .select('pokemon.name')
      .where("pokemon.attack->>'name' = :attackName", {
        attackName: pokemon.weakness.name,
      })
      .getMany();

    console.log('Weak against --> ', weakAgainst);

    const resistantAgainst = pokemon.resistance
      ? await this.pokemonRepository
          .createQueryBuilder('pokemon')
          .select('pokemon.name')
          .where('pokemon.attack @> :attack', {
            attack: JSON.stringify({ name: pokemon.resistance.name }),
          })
          .getMany()
      : [];

    return {
      weaknesses: weakAgainst.map((p) => p.name),
      resistances: resistantAgainst.map((p) => p.name),
    };
  }

  async delete({ value, isId = true }): Promise<string> {
    try {
      if (isId && !isNaN(+value)) {
        return this.deleteHelper(value);
      }

      const pokemon = await this.pokemonRepository.findOne({
        where: {
          name: value,
        },
      });

      if (!pokemon) {
        throw new NotFoundException('Pokemon not found');
      }

      return this.deleteHelper(pokemon.id.toString());
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  deleteHelper = async (id: string): Promise<string> => {
    const result = await this.pokemonRepository.delete({ id: +id });

    if (!result.affected) {
      throw new NotFoundException('Pokemon not found');
    }

    return 'Pokemon deleted successfully';
  };

  async simulateBattle(
    attackerId: string,
    defenderId: string,
  ): Promise<{
    id: number;
    name: string;
    message: string;
  }> {
    const attacker = await this.pokemonRepository.findOne({
      where: { id: +attackerId },
    });

    if (!attacker) {
      throw new NotFoundException('Attacker Pokemon not found');
    }

    const defender = await this.pokemonRepository.findOne({
      where: { id: +defenderId },
    });

    if (!defender) {
      throw new NotFoundException('Defender Pokemon not found');
    }

    console.log('------------------------------------');
    console.log('Battle #', Date.now());
    console.log('------------------------------------');

    console.log('Attacker is ', attacker.name);
    console.log('Defender is ', defender.name);

    let attackDamage = attacker.attack.damage;
    console.log('Attack damage ---> ', attacker.attack.damage);

    let resistanceLevel = 0;
    if (
      defender?.resistance &&
      defender?.resistance?.name === attacker.attack.name
    ) {
      resistanceLevel = defender?.resistance?.value;
    }

    console.log('Defender resistance level ', resistanceLevel);

    attackDamage += resistanceLevel;

    console.log('Attack damage after resistance ', attackDamage);

    const damageMultiplier =
      defender.weakness.name === attacker.attack.name
        ? defender.weakness.multiplier
        : 1;

    console.log('Damage multiplier ', damageMultiplier);

    attackDamage *= damageMultiplier;

    console.log('Defender health before attack ', defender.health);

    console.log('Attack damage after weakness ', attackDamage);

    const winner = attackDamage >= defender.health ? attacker : defender;

    console.log('Winner is ', winner.name);

    return {
      id: winner.id,
      name: winner.name,
      message: `${winner.name} won the battle`,
    };
  }
}
