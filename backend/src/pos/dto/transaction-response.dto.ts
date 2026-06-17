import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TransactionItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productSku: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  subtotal: number;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNo: string;

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional()
  discountType?: string;

  @ApiProperty()
  discountValue: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  paymentStatus: string;

  @ApiPropertyOptional()
  customerId?: string;

  @ApiPropertyOptional()
  customerName?: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [TransactionItemResponseDto] })
  items: TransactionItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ReceiptDataDto {
  @ApiProperty()
  invoiceNo: string;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional()
  customerName?: string;

  @ApiProperty({ type: [TransactionItemResponseDto] })
  items: TransactionItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  paymentStatus: string;
}
