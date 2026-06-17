import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CategoryInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sku: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  purchasePrice: number;

  @ApiProperty()
  sellingPrice: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  minStock: number;

  @ApiPropertyOptional()
  image?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: CategoryInfo })
  category: CategoryInfo;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
