import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entity/pokemon.entity';
import { PokemonsService } from './pokemons.service';
import { ParseNestedJsonPipe } from './utilities/parse-json.decorator';

@ApiBearerAuth()
@ApiTags('pokemons')
@Controller('pokemons')
export class PokemonsController {
  constructor(private readonly pokemonsService: PokemonsService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async createPokemon(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ParseNestedJsonPipe(), new ValidationPipe({ transform: true }))
    createPokemonDto: CreatePokemonDto,
  ): Promise<Pokemon> {
    if (!file?.mimetype?.includes('image')) {
      throw new BadRequestException('File must be an image');
    }

    try {
      const pokemon = await this.pokemonsService.create(createPokemonDto, file);
      return pokemon;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('update')
  updatePokemon(
    @Query('name') name: string,
    @Body() updatePokemonDto: UpdatePokemonDto,
  ): Promise<Pokemon> {
    if (!name) {
      throw new BadRequestException('Name must be provided');
    }

    return this.pokemonsService.update(name, updatePokemonDto);
  }

  @Get('all')
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getAllPokemons(
    @Query('limit') limit = '5',
    @Query('offset') offset = '0',
  ): Promise<Pokemon[]> {
    if (isNaN(+limit) || isNaN(+offset)) {
      throw new BadRequestException('Limit and offset must be numbers');
    }

    // If limit is greater than 20, set it to 20 (to prevent large data retrieval)
    if (+limit > 20) {
      limit = '20';
      console.log('Limit set to 20');
    }

    return this.pokemonsService.findAll(+limit, +offset);
  }

  @Get()
  getPokemon(
    @Query('id') id: string,
    @Query('name') name: string,
  ): Promise<Pokemon> {
    if (!id && !name) {
      throw new BadRequestException(
        'Query parameter id or name must be provided',
      );
    }

    if (id && !isNaN(+id)) {
      return this.pokemonsService.findOne({ id });
    } else if (name) {
      return this.pokemonsService.findOne({ name });
    }

    throw new BadRequestException('Invalid query parameter');
  }

  @Get('weaknessAndResistance')
  getWeaknessAndResistance(
    @Query('name') name: string,
  ): Promise<{ weaknesses: string[]; resistances: string[] }> {
    if (!name) {
      throw new BadRequestException('Name must be provided');
    }

    return this.pokemonsService.getWeaknessAndResistance(name);
  }

  @Delete('delete')
  deletePokemon(
    @Query('name') name: string,
    @Query('id') id: string,
  ): Promise<string> {
    if (!id && !name) {
      throw new BadRequestException(
        'Query parameter id or name must be provided',
      );
    }

    return this.pokemonsService.delete({
      value: id || name,
      isId: !!id,
    });
  }

  @Get('simulateBattle')
  simulateBattle(
    @Query('attacker') attackerId: string,
    @Query('defender') defenderId: string,
  ): Promise<{
    id: number;
    name: string;
    message: string;
  }> {
    if (!attackerId || !defenderId) {
      throw new NotFoundException('Attacker and defender must be provided');
    }

    return this.pokemonsService.simulateBattle(attackerId, defenderId);
  }
}
