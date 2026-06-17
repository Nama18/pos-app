import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../transactions/entities/transaction.entity';

export class SalesReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
