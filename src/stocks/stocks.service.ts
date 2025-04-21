// src/stocks/stocks.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  StockDefinition,
  StockTickData,
  FullStockData,
  StockHistoryPoint,
} from './interfaces/stock.interface';
import { NotFoundException } from '@nestjs/common';

// Constants for simulation
const SIMULATION_INTERVAL_MS = 5000; // Update prices every 5 seconds
const MAX_HISTORY_POINTS = 100; // Keep last 100 price points per stock
const MAX_PRICE_CHANGE_PERCENT = 0.015; // Max +/- 1.5% change per tick

@Injectable()
export class StocksService implements OnModuleInit {
  private readonly logger = new Logger(StocksService.name);

  // In-memory storage for current stock data and history
  private currentStockData: Map<string, FullStockData> = new Map();
  private stockHistory: Map<string, StockHistoryPoint[]> = new Map();

  // Base definitions of supported stocks
  private readonly supportedStocks: StockDefinition[] = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'META', name: 'Meta Platforms, Inc.' },
  ];

  constructor() {
    this.initializeStocks();
  }

  // Start simulation when module loads
  onModuleInit() {
    this.startPriceSimulation();
  }

  private initializeStocks(): void {
    this.supportedStocks.forEach(stockDef => {
      // Create somewhat realistic initial data
      const initialPrice = parseFloat((Math.random() * 400 + 50).toFixed(2)); // Random price between 50-450
      const now = Date.now();

      const initialData: FullStockData = {
        ...stockDef,
        price: initialPrice,
        change: 0,
        changePercent: 0,
        open: initialPrice, // Open at the initial price
        high: initialPrice,
        low: initialPrice,
        volume: Math.floor(Math.random() * 1000000 + 50000), // Random volume
        previousClose: parseFloat((initialPrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)), // Slightly different previous close
        timestamp: now,
      };

      this.currentStockData.set(stockDef.symbol, initialData);
      // Initialize history with the starting point
      this.stockHistory.set(stockDef.symbol, [{ timestamp: now, price: initialPrice }]);
    });
    this.logger.log(`Initialized ${this.currentStockData.size} stocks with simulated data.`);
  }

  private simulatePriceUpdate(currentData: FullStockData): FullStockData {
    const changePercent = (Math.random() - 0.5) * 2 * MAX_PRICE_CHANGE_PERCENT; // +/- max change
    let newPrice = currentData.price * (1 + changePercent);
    newPrice = parseFloat(Math.max(1, newPrice).toFixed(2)); // Ensure price > 0 and format

    const change = parseFloat((newPrice - currentData.open).toFixed(2));
    const changePercentCalc = parseFloat(((change / currentData.open) * 100).toFixed(2));
    const newHigh = Math.max(currentData.high, newPrice);
    const newLow = Math.min(currentData.low, newPrice);
    const volumeIncrease = Math.floor(Math.random() * 10000 + 100); // Add some volume
    const newVolume = currentData.volume + volumeIncrease;
    const now = Date.now();

    return {
      ...currentData, // Symbol, name, open, previousClose remain the same for the 'day'
      price: newPrice,
      change: change,
      changePercent: changePercentCalc,
      high: newHigh,
      low: newLow,
      volume: newVolume,
      timestamp: now,
    };
  }

  private updateAllStockPrices(): void {
    this.logger.debug('Simulating stock price updates...');
    this.supportedStocks.forEach(stockDef => {
      const currentData = this.currentStockData.get(stockDef.symbol);
      if (currentData) {
        const updatedData = this.simulatePriceUpdate(currentData);
        this.currentStockData.set(stockDef.symbol, updatedData);

        // Update history
        const history = this.stockHistory.get(stockDef.symbol) || [];
        history.push({ timestamp: updatedData.timestamp, price: updatedData.price });

        // Limit history size
        if (history.length > MAX_HISTORY_POINTS) {
          history.shift(); // Remove the oldest point
        }
        this.stockHistory.set(stockDef.symbol, history);
      }
    });
  }

  private startPriceSimulation(): void {
    setInterval(() => {
      this.updateAllStockPrices();
    }, SIMULATION_INTERVAL_MS);
    this.logger.log(`Stock price simulation started (updates every ${SIMULATION_INTERVAL_MS / 1000}s).`);
  }

  /**
   * Returns the current data for all supported stocks.
   */
  getAllSupportedStocks(): FullStockData[] {
    return Array.from(this.currentStockData.values());
  }

  /**
   * Returns the current data for a single stock symbol.
   * @param symbol Stock symbol (case-insensitive)
   */
  getStockData(symbol: string): FullStockData {
    const data = this.currentStockData.get(symbol.toUpperCase());
    if (!data) {
      throw new NotFoundException(`Stock data not found for symbol: ${symbol}`);
    }
    return data;
  }

  /**
   * Returns the recent price history for a single stock symbol.
   * @param symbol Stock symbol (case-insensitive)
   */
  getStockHistory(symbol: string): StockHistoryPoint[] {
    const history = this.stockHistory.get(symbol.toUpperCase());
    if (!history) {
      // If the stock *should* exist but somehow doesn't have history, return empty or throw
      // If the stock symbol itself is invalid, getStockData would have thrown already if called first
      // Let's check if it's a supported stock first for consistency
      if (!this.currentStockData.has(symbol.toUpperCase())) {
         throw new NotFoundException(`Stock history not found for symbol: ${symbol}`);
      }
      // If supported but no history (shouldn't happen with initialization), return empty
      this.logger.warn(`No history found for initialized stock ${symbol}, returning empty.`);
      return [];
    }
    return history;
  }
}