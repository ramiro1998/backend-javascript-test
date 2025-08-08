import { IsArray, IsUUID } from 'class-validator';

export class DeleteManyDto {
  @IsArray()
  ids: string[];
}