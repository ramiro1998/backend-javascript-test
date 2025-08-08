import { IsOptional, IsDateString, IsString } from 'class-validator';

export class ReportDeletedByCategoryDto {
    @IsString()
    category: string;

    @IsDateString()
    from: string;

    @IsDateString()
    to: string;
}