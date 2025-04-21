import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  StockDefinition,
  FullStockData,
  StockHistoryPoint,
} from './interfaces/stock.interface';
import { NotFoundException } from '@nestjs/common';

// Constants for simulation
const SIMULATION_INTERVAL_MS = 5000; // Interval for price updates
const MAX_HISTORY_POINTS = 100;      // Max historical data points per stock
const MAX_PRICE_CHANGE_PERCENT = 0.015; // Max price fluctuation per tick

@Injectable()
export class StocksService implements OnModuleInit {
  private readonly logger = new Logger(StocksService.name);

  // In-memory storage
  private currentStockData: Map<string, FullStockData> = new Map();
  private stockHistory: Map<string, StockHistoryPoint[]> = new Map();

  // Base definitions of stocks available in the simulation
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

  onModuleInit() {
    this.startPriceSimulation();
  }

  private initializeStocks(): void {
    this.supportedStocks.forEach(stockDef => {
      const initialPrice = parseFloat((Math.random() * 400 + 50).toFixed(2));
      const now = Date.now();

      const initialData: FullStockData = {
        ...stockDef,
        price: initialPrice,
        change: 0,
        changePercent: 0,
        open: initialPrice, // Set open price for the simulated 'day'
        high: initialPrice,
        low: initialPrice,
        volume: Math.floor(Math.random() * 1000000 + 50000),
        previousClose: parseFloat((initialPrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
        timestamp: now,
      };

      this.currentStockData.set(stockDef.symbol, initialData);
      this.stockHistory.set(stockDef.symbol, [{ timestamp: now, price: initialPrice }]); // Start history
    });
    this.logger.log(`Initialized ${this.currentStockData.size} stocks with simulated data.`);
  }

  // Calculates the next simulated tick data based on current data
  private simulatePriceUpdate(currentData: FullStockData): FullStockData {
    const priceChangePercent = (Math.random() - 0.5) * 2 * MAX_PRICE_CHANGE_PERCENT;
    let newPrice = currentData.price * (1 + priceChangePercent);
    newPrice = parseFloat(Math.max(1, newPrice).toFixed(2)); // Ensure price > 0 and format

    const change = parseFloat((newPrice - currentData.open).toFixed(2));
    const changePercent = parseFloat(((change / currentData.open) * 100).toFixed(2));
    const newHigh = Math.max(currentData.high, newPrice);
    const newLow = Math.min(currentData.low, newPrice);
    const volumeIncrease = Math.floor(Math.random() * 10000 + 100);
    const newVolume = currentData.volume + volumeIncrease;
    const now = Date.now();

    return {
      ...currentData, // Keep symbol, name, open, previousClose
      price: newPrice,
      change: change,
      changePercent: changePercent,
      high: newHigh,
      low: newLow,
      volume: newVolume,
      timestamp: now,
    };
  }

  // Updates prices and history for all supported stocks
  private updateAllStockPrices(): void {
    this.logger.debug('Simulating stock price updates...');
    this.supportedStocks.forEach(stockDef => {
      const currentData = this.currentStockData.get(stockDef.symbol);
      if (currentData) {
        const updatedData = this.simulatePriceUpdate(currentData);
        this.currentStockData.set(stockDef.symbol, updatedData);

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

  // Starts the interval timer for the price simulation
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
   * @throws {NotFoundException} If the symbol is not supported.
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
   * @throws {NotFoundException} If the symbol is not supported.
   */
  getStockHistory(symbol: string): StockHistoryPoint[] {
    // Check if the stock itself is supported first
    if (!this.currentStockData.has(symbol.toUpperCase())) {
       throw new NotFoundException(`Stock history not found for symbol: ${symbol}`);
    }
    // If supported, return its history (or empty array if somehow missing, though unlikely)
    const history = this.stockHistory.get(symbol.toUpperCase());
    if (!history) {
      this.logger.warn(`No history array found for initialized stock ${symbol}, returning empty.`);
      return [];
    }
    return history;
  }
}