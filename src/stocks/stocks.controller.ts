import { Controller, Get, Param, Logger } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { FullStockData, StockHistoryPoint } from './interfaces/stock.interface';

@Controller('stocks')
export class StocksController {
  private readonly logger = new Logger(StocksController.name);

  constructor(private readonly stocksService: StocksService) {}

  @Get()
  async getAllStocks(): Promise<FullStockData[]> {
    this.logger.log('Request received for all supported stocks');
    return this.stocksService.getAllSupportedStocks();
  }

  @Get(':symbol')
  async getSingleStockData(@Param('symbol') symbol: string): Promise<FullStockData> {
    this.logger.log(`Request received for single stock: ${symbol}`);
    // Service method throws NotFoundException if symbol is invalid
    return this.stocksService.getStockData(symbol.toUpperCase());
  }

  // Endpoint for recent historical price data
  @Get(':symbol/history')
  async getStockHistory(@Param('symbol') symbol: string): Promise<StockHistoryPoint[]> {
    this.logger.log(`Request received for stock history: ${symbol}`);
    // Service method throws NotFoundException if symbol is invalid
    return this.stocksService.getStockHistory(symbol.toUpperCase());
  }
}