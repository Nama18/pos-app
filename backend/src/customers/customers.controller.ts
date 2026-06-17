import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('Admin', 'Cashier')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  @ApiOkResponse({ type: [CustomerResponseDto] })
  findAll(@Query() query: PaginationDto & { search?: string }) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiOkResponse({ type: CustomerResponseDto })
  findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Cashier')
  @ApiOperation({ summary: 'Update customer' })
  @ApiOkResponse({ type: CustomerResponseDto })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles('Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete customer' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
