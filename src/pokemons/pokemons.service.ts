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
import { S3Service } from 'src/s3/s3.service';

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

    const pokemon = this.pokemonRepository.create({
      name,
      health,
      attack,
      weakness,
      resistance,
      filePath: url,
    });
    return this.pokemonRepository.save(pokemon);
  }

  async update(
    id: string,
    updatePokemonDto: UpdatePokemonDto,
  ): Promise<Pokemon> {
    const pokemon = await this.pokemonRepository.preload({
      id: +id,
      ...updatePokemonDto,
    });

    if (!pokemon) {
      throw new NotFoundException('Pokemon not found');
    }

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

  async getWeaknessAndResistance(id: string): Promise<{
    weaknesses: string[];
    resistances: string[];
  }> {
    const pokemon = await this.pokemonRepository.findOne({
      select: ['weakness', 'resistance'],
      where: { id: +id },
    });

    if (!pokemon) {
      throw new NotFoundException('Pokemon not found');
    }

    const weakAgainst = pokemon.weakness
      ? await this.pokemonRepository
          .createQueryBuilder('pokemon')
          .select('pokemon.name')
          .where('pokemon.attack @> :attack', {
            attack: JSON.stringify({ name: pokemon.weakness.name }),
          })
          .getMany()
      : [];

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

  async delete(id: string): Promise<void> {
    const pokemon = await this.pokemonRepository.findOne({
      where: { id: +id },
    });

    if (!pokemon) {
      throw new NotFoundException('Pokemon not found');
    }

    await this.pokemonRepository.delete({ id: +id });
  }

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

    const attackerAttack: Pokemon['attack'] = JSON.parse(
      attacker.attack.toString(),
    );
    let attackDamage = attackerAttack.damage;
    console.log('Attack damage ---> ', attackerAttack);

    const defenderResistance: Pokemon['resistance'] = defender.resistance
      ? JSON.parse(defender.resistance.toString())
      : null;

    let resistanceLevel = 0;
    if (defenderResistance && defenderResistance.name === attackerAttack.name) {
      resistanceLevel = defenderResistance.value;
    }

    console.log('Defender resistance level ', resistanceLevel);

    attackDamage += resistanceLevel;

    console.log('Attack damage after resistance ', attackDamage);

    const defenderWeakness: Pokemon['weakness'] = JSON.parse(
      defender.weakness.toString(),
    );
    const damageMultiplier =
      defenderWeakness.name === attackerAttack.name
        ? defenderWeakness.multiplier
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
