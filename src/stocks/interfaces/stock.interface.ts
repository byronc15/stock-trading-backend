// src/stocks/interfaces/stock.interface.ts

export interface StockTickData {
    price: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    volume: number; // Simulated volume for the current 'day'
    previousClose?: number; // Optional: Price at the end of the last 'day'
    timestamp: number; // Last update time
  }
  
  export interface StockDefinition {
    symbol: string;
    name: string;
  }
  
  export interface FullStockData extends StockDefinition, StockTickData {}
  
  export interface StockHistoryPoint {
    timestamp: number;
    price: number;
  }