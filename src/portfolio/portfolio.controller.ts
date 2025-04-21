import { Controller, Get, InternalServerErrorException, Logger } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { StocksService } from '../stocks/stocks.service';

@Controller('portfolio')
export class PortfolioController {
  private readonly logger = new Logger(PortfolioController.name);

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly stocksService: StocksService,
  ) {}

  @Get()
  async getPortfolio() {
    this.logger.log('Request received for portfolio');
    const holdingsMap = this.portfolioService.getHoldingsMap();
    const symbolsToFetch = Object.keys(holdingsMap);

    let currentPrices: Record<string, number> = {};

    if (symbolsToFetch.length > 0) {
      this.logger.log(`Fetching current prices for held stocks: ${symbolsToFetch.join(', ')}`);
      try {
        // Fetch price data for all held symbols concurrently
        const pricePromises = symbolsToFetch.map(symbol => this.stocksService.getStockData(symbol));
        const stockDataArray = await Promise.all(pricePromises);

        // Create the { symbol: price } map needed by PortfolioService
        stockDataArray.forEach(stockData => {
          // Only include if stockData exists and price is valid
          if (stockData && typeof stockData.price === 'number' && stockData.price > 0) {
              currentPrices[stockData.symbol] = stockData.price;
          } else {
              this.logger.warn(`Could not retrieve valid price for held stock: ${stockData?.symbol ?? 'Unknown'}. It will be valued at $0.`);
              // Ensure symbol exists in price map with 0 value for consistent portfolio calculation
              if(stockData?.symbol) {
                  currentPrices[stockData.symbol] = 0;
              }
          }
        });
      } catch (error) {
          this.logger.error(`Error fetching prices for portfolio calculation: ${error.message}`, error.stack);
          // Throw an internal server error if fetching prices fails, as portfolio value is inaccurate
          throw new InternalServerErrorException('Failed to fetch current market prices for portfolio.');
      }
    } else {
        this.logger.log('No holdings found, skipping price fetch.');
    }

    return this.portfolioService.getPortfolio(currentPrices);
  }
}