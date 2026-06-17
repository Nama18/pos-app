import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto, ReceiptDataDto } from './dto/transaction-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('pos')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('transactions')
  @Roles('Admin', 'Cashier')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transaction (POS sale)' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  createTransaction(
    @Body() dto: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.posService.createTransaction(dto, userId);
  }

  @Get('transactions')
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Get all transactions with pagination' })
  @ApiOkResponse({ type: [TransactionResponseDto] })
  getAllTransactions(@Query() query: PaginationDto) {
    return this.posService.getAllTransactions(query);
  }

  @Get('transactions/:id')
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Get transaction detail' })
  @ApiOkResponse({ type: TransactionResponseDto })
  getTransaction(@Param('id') id: string) {
    return this.posService.getTransaction(id);
  }

  @Get('transactions/:id/receipt')
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Get receipt data for a transaction' })
  @ApiOkResponse({ type: ReceiptDataDto })
  getReceipt(@Param('id') id: string) {
    return this.posService.getReceipt(id);
  }

  @Get('products')
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Get active products for POS' })
  getPosProducts() {
    return this.posService.getPosProducts();
  }
}
