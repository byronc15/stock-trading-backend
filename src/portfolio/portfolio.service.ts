import { Injectable, Logger } from '@nestjs/common';

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  price: number; // Current price at time of portfolio calculation
  value: number; // quantity * price
}

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private cash = 100000;
  // Internal state: Map of stock symbol to quantity owned
  private holdings: Record<string, number> = {};

  /**
   * Calculates and returns the current portfolio state, valued at provided market prices.
   * @param currentPrices A map of { symbol: price } for currently held stocks.
   */
  getPortfolio(currentPrices: Record<string, number>): {
    cash: number;
    holdings: PortfolioHolding[];
    totalValue: number;
  } {
    this.logger.log('Calculating portfolio state...');
    let currentHoldingsValue = 0;

    const portfolioHoldings: PortfolioHolding[] = Object.entries(this.holdings)
      .map(([symbol, quantity]) => {
        const currentPrice = currentPrices[symbol];
        // Handle cases where a price might be missing for a held stock
        if (typeof currentPrice !== 'number' || currentPrice <= 0) {
            this.logger.warn(`Missing or invalid price for held stock ${symbol}. Using price 0 for calculation.`);
            return { symbol, quantity, price: 0, value: 0 };
        }
        const value = parseFloat((currentPrice * quantity).toFixed(2));
        currentHoldingsValue += value;
        return { symbol, quantity, price: currentPrice, value };
      });

    const totalValue = parseFloat((this.cash + currentHoldingsValue).toFixed(2));
    const cashRounded = parseFloat(this.cash.toFixed(2));

    this.logger.log(`Portfolio calculated: Cash $${cashRounded}, Holdings Value $${currentHoldingsValue.toFixed(2)}, Total $${totalValue}`);

    return {
      cash: cashRounded,
      holdings: portfolioHoldings,
      totalValue: totalValue,
    };
  }

  updateCash(amount: number): void {
    this.cash += amount;
    this.logger.log(`Cash updated by ${amount.toFixed(2)}. New balance: ${this.cash.toFixed(2)}`);
  }

  updateHoldings(symbol: string, quantityChange: number): void {
    const currentQuantity = this.holdings[symbol] || 0;
    const newQuantity = currentQuantity + quantityChange;
    this.holdings[symbol] = newQuantity;

    this.logger.log(`Holdings for ${symbol} updated by ${quantityChange}. New quantity: ${newQuantity}`);

    // Remove stock from holdings if quantity becomes zero or less
    if (newQuantity <= 0) {
      delete this.holdings[symbol];
      this.logger.log(`Removed ${symbol} from holdings as quantity reached zero or less.`);
    }
  }

  getCash(): number {
    return this.cash;
  }

  // Returns a copy of the internal holdings map (symbol -> quantity)
  getHoldingsMap(): Record<string, number> {
    return { ...this.holdings };
  }
}