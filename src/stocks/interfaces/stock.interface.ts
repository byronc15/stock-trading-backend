export interface StockTickData {
    price: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    previousClose?: number;
    timestamp: number;
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