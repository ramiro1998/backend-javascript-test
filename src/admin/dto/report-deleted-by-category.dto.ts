import { IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportDeletedByCategoryDto {
    @ApiProperty({
        description: 'The category to filter by.',
        example: 'Electronics',
        type: String,
    })
    @IsString()
    category: string;

    @ApiProperty({
        description: 'Start date of the range (YYYY-MM-DD).',
        example: '2024-01-01',
        type: String,
    })
    @IsDateString()
    from: string;

    @ApiProperty({
        description: 'End date of the range (YYYY-MM-DD).',
        example: '2024-03-31',
        type: String,
    })
    @IsDateString()
    to: string;
}