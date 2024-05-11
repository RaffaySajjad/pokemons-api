import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const MANDATORY_FIELDS = ['attack', 'weakness'];
const OPTIONAL_FIELDS = ['resistance'];

@Injectable()
export class ParseNestedJsonPipe implements PipeTransform {
  async transform(value) {
    try {
      MANDATORY_FIELDS.forEach((key) => {
        this.parseField(value, key, true);
      });

      OPTIONAL_FIELDS.forEach((key) => {
        this.parseField(value, key, false);
      });

      return value;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private parseField(value, key, isMandatory) {
    if (value[key]) {
      try {
        value[key] = JSON.parse(value[key]);
      } catch (err) {
        throw new BadRequestException(`Invalid JSON format for '${key}'`);
      }
    } else if (isMandatory) {
      throw new BadRequestException(`${key} is a required field`);
    }
  }
}
