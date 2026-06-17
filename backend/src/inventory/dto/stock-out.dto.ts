import { IsUUID, IsNotEmpty, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class StockOutDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
