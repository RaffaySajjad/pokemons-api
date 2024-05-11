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

  @Patch('update/:id')
  updatePokemon(
    @Param('id') id: string,
    @Body() updatePokemonDto: UpdatePokemonDto,
  ): Promise<Pokemon> {
    return this.pokemonsService.update(id, updatePokemonDto);
  }

  @Get('all')
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getAllPokemons(
    @Query('limit') limit = 1,
    @Query('offset') offset = 0,
  ): Promise<Pokemon[]> {
    return this.pokemonsService.findAll(+limit, +offset);
  }

  @Get()
  getPokemon(
    @Query('id') id: string,
    @Query('name') name: string,
  ): Promise<Pokemon> {
    if (id) {
      return this.pokemonsService.findOne({ id });
    } else if (name) {
      return this.pokemonsService.findOne({ name });
    } else {
      throw new NotFoundException(
        'Query parameter id or name must be provided',
      );
    }
  }

  @Get('weaknessAndResistance/:id')
  getWeaknessAndResistance(
    @Param('id') id: string,
  ): Promise<{ weaknesses: string[]; resistances: string[] }> {
    return this.pokemonsService.getWeaknessAndResistance(id);
  }

  @Delete('delete/:id')
  deletePokemon(@Param('id') id: string): Promise<void> {
    return this.pokemonsService.delete(id);
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
