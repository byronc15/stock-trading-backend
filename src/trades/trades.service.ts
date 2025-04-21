import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PortfolioService } from '../portfolio/portfolio.service';
import { StocksService } from '../stocks/stocks.service';
import { TradeDto } from './dto/trade.dto';

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly stocksService: StocksService,
  ) {}

  async executeTrade(tradeDto: TradeDto): Promise<{ message: string; symbol: string; quantity: number; side: string }> {
    const { symbol, quantity, side } = tradeDto;
    this.logger.log(`Attempting ${side.toUpperCase()} trade: ${quantity} ${symbol}`);

    const stockData = await this.stocksService.getStockData(symbol);

    // Validate stock is supported and has a valid price from the StocksService
    if (!stockData) {
        throw new NotFoundException(`Stock symbol "${symbol}" is not supported for trading.`);
    }
    if (typeof stockData.price !== 'number' || stockData.price <= 0) {
        this.logger.error(`Cannot execute trade for ${symbol}: Invalid or missing price from API.`);
        throw new InternalServerErrorException(`Could not retrieve a valid price for ${symbol}. Trade cancelled.`);
    }

    const currentPrice = stockData.price;
    const totalCost = parseFloat((currentPrice * quantity).toFixed(2));

    // Validate trade against user's portfolio (cash/shares)
    if (side === 'buy') {
      const currentCash = this.portfolioService.getCash();
      if (currentCash < totalCost) {
        this.logger.warn(`Trade rejected: Insufficient funds for ${symbol}. Need $${totalCost.toFixed(2)}, have $${currentCash.toFixed(2)}`);
        throw new BadRequestException(`Insufficient funds. Need $${totalCost.toFixed(2)}, but only have $${currentCash.toFixed(2)}.`);
      }
    } else { // side === 'sell'
      const holdingsMap = this.portfolioService.getHoldingsMap();
      const sharesOwned = holdingsMap[symbol] || 0;
      if (sharesOwned < quantity) {
        this.logger.warn(`Trade rejected: Insufficient shares for ${symbol}. Trying to sell ${quantity}, own ${sharesOwned}`);
        throw new BadRequestException(`Insufficient shares. Trying to sell ${quantity} ${symbol}, but only own ${sharesOwned}.`);
      }
    }

    // Execute the trade by updating portfolio state (acts as in-memory transaction)
    try {
        if (side === 'buy') {
            this.portfolioService.updateCash(-totalCost);
            this.portfolioService.updateHoldings(symbol, quantity);
        } else {
            this.portfolioService.updateCash(totalCost);
            this.portfolioService.updateHoldings(symbol, -quantity); // Subtract quantity for sell
        }
    } catch (error) {
        this.logger.error(`CRITICAL: Error during portfolio state update for ${symbol} trade: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Failed to update portfolio state during trade.');
    }

    this.logger.log(`Successfully executed ${side.toUpperCase()} trade: ${quantity} ${symbol} @ $${currentPrice.toFixed(2)}`);

    // Return success response
    return {
        message: `Trade successful: ${side.toUpperCase()} ${quantity} ${symbol}`,
        symbol: symbol,
        quantity: quantity,
        side: side,
    };
  }
}