import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Get all transactions with pagination and filters' })
  findAll(@Query() query: TransactionQueryDto) {
    return this.transactionsService.findAll(query);
  }

  @Get(':id')
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Get transaction detail by ID' })
  findById(@Param('id') id: string) {
    return this.transactionsService.findById(id);
  }
}
