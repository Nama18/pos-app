import { IsUUID, IsNotEmpty, IsInt, Min, IsString, IsOptional } from 'class-validator';

export class AdjustDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
