import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { SalesReportDto } from './dto/sales-report.dto';
import { DateRangeDto } from './dto/date-range.dto';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles('Admin')
  getSalesReport(@Query() query: SalesReportDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('sales/summary')
  @Roles('Admin')
  getSalesSummary(@Query() query: DateRangeDto) {
    return this.reportsService.getSalesSummary(query);
  }

  @Get('inventory')
  @Roles('Admin', 'Warehouse')
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('top-products')
  @Roles('Admin', 'Warehouse')
  getTopProducts(@Query() query: DateRangeDto) {
    return this.reportsService.getTopProducts(query);
  }
}
