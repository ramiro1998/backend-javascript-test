import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class DeleteManyDto {
  @ApiProperty({
    description: 'An array of product IDs to be soft-deleted.',
    example: [
      '65d3a58e-d922-4217-a006-258169999912',
      '65d3a58e-d922-4217-a006-258169999913',
    ],
    type: [String],
  })
  @IsArray()
  ids: string[];
}
