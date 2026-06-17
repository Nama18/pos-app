import { IsUUID, IsNotEmpty, IsInt, Min, IsString, IsOptional } from 'class-validator';

export class AdjustDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
