import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { DateRangeDto } from '../reports/dto/date-range.dto';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('Admin', 'Cashier', 'Warehouse')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('sales-chart')
  @Roles('Admin', 'Cashier')
  getSalesChart(@Query() query: DateRangeDto) {
    return this.dashboardService.getSalesChart(query);
  }

  @Get('recent-transactions')
  @Roles('Admin', 'Cashier')
  getRecentTransactions(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getRecentTransactions(limit);
  }

  @Get('low-stock')
  @Roles('Admin', 'Warehouse')
  getLowStockAlerts() {
    return this.dashboardService.getLowStockAlerts();
  }
}
