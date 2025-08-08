import { IsOptional, IsBooleanString, IsDateString } from 'class-validator';

export class ReportActiveDto {
    @IsOptional()
    @IsBooleanString()
    hasPrice?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}