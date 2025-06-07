import { IsObject, IsOptional, IsString } from 'class-validator';

export class CypherQueryDto {
  @IsString()
  query: string;

  @IsObject()
  @IsOptional()
  params?: Record<string, any>;
}
