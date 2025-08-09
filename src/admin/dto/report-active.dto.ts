import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBooleanString, IsDateString } from 'class-validator';

export class ReportActiveDto {
  @ApiProperty({
    required: false,
    enum: ['true', 'false'],
    description: 'Filter by products with or without a price',
  })
  @IsOptional()
  @IsBooleanString()
  hasPrice?: string;

  @ApiProperty({
    required: false,
    description: 'Filter products updated from this date (YYYY-MM-DD)',
    example: '2024-01-23',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    required: false,
    description: 'Filter products updated until this date (YYYY-MM-DD)',
    example: '2024-03-31',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
