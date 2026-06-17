import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InventoryService, InventoryQueryDto } from './inventory.service';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { AdjustDto } from './dto/adjust.dto';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('stock-in')
  @Roles('Admin', 'Warehouse')
  stockIn(@Body() dto: StockInDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.stockIn(dto, userId);
  }

  @Post('stock-out')
  @Roles('Admin', 'Warehouse')
  stockOut(@Body() dto: StockOutDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.stockOut(dto, userId);
  }

  @Post('adjust')
  @Roles('Admin')
  adjust(@Body() dto: AdjustDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.adjust(dto, userId);
  }

  @Get()
  @Roles('Admin', 'Cashier', 'Warehouse')
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('low-stock')
  @Roles('Admin', 'Cashier', 'Warehouse')
  getLowStock() {
    return this.inventoryService.getLowStock();
  }
}
