import { Test, TestingModule } from '@nestjs/testing';
import { StocksService } from './stocks.service';
import { NotFoundException } from '@nestjs/common';

// Use Jest's fake timers to control setInterval in the service
jest.useFakeTimers();

describe('StocksService', () => {
  let service: StocksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StocksService],
    }).compile();

    service = module.get<StocksService>(StocksService);
  });

   afterEach(() => {
     // Clear timers between tests
     jest.clearAllTimers();
   });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initialization', () => {
      it('should initialize supported stocks with data', () => {
          const allStocks = service.getAllSupportedStocks();
          expect(allStocks.length).toBeGreaterThan(0);
          const aapl = allStocks.find(s => s.symbol === 'AAPL');

          expect(aapl).toBeDefined();
          if (aapl) { // Type guard for TypeScript
              expect(aapl.price).toBeGreaterThan(0);
              expect(aapl.open).toEqual(aapl.price);
              expect(aapl.change).toEqual(0);
              expect(aapl.changePercent).toEqual(0);
              expect(aapl.high).toEqual(aapl.price);
              expect(aapl.low).toEqual(aapl.price);
              expect(aapl.volume).toBeGreaterThanOrEqual(0);
              expect(aapl.timestamp).toBeLessThanOrEqual(Date.now());
          }
      });

       it('should initialize history for supported stocks', () => {
           const aaplHistory = service.getStockHistory('AAPL');
           expect(aaplHistory).toHaveLength(1); // Should start with one history point
           const aaplData = service.getStockData('AAPL');
           expect(aaplHistory[0].price).toEqual(aaplData.price);
           expect(aaplHistory[0].timestamp).toEqual(aaplData.timestamp);
       });
  });

  describe('Data Retrieval', () => {
      it('getAllSupportedStocks should return all initialized stocks', () => {
          // Test relies on the hardcoded list size (6) in the service
          expect(service.getAllSupportedStocks()).toHaveLength(6);
      });

      it('getStockData should return data for a valid symbol', () => {
          const data = service.getStockData('MSFT');
          expect(data).toBeDefined();
          expect(data.symbol).toBe('MSFT');
          expect(data.name).toBe('Microsoft Corp.');
      });

      it('getStockData should throw NotFoundException for invalid symbol', () => {
          expect(() => service.getStockData('INVALID')).toThrow(NotFoundException);
      });

      it('getStockHistory should return history for a valid symbol', () => {
          const history = service.getStockHistory('TSLA');
          expect(history).toBeInstanceOf(Array);
          expect(history.length).toBeGreaterThanOrEqual(1);
          expect(history[0]).toHaveProperty('timestamp');
          expect(history[0]).toHaveProperty('price');
      });

      it('getStockHistory should throw NotFoundException for invalid symbol', () => {
          expect(() => service.getStockHistory('INVALID')).toThrow(NotFoundException);
      });
  });

  describe('Price Simulation', () => {
      it('should update stock prices after interval', () => {
          const initialAapl = { ...service.getStockData('AAPL') };

          // Fast-forward time using fake timers
          jest.advanceTimersByTime(5000 + 100); // SIMULATION_INTERVAL_MS + buffer

          const updatedAapl = service.getStockData('AAPL');

          expect(updatedAapl.price).not.toEqual(initialAapl.price);
          expect(updatedAapl.timestamp).toBeGreaterThan(initialAapl.timestamp);
          expect(updatedAapl.change).not.toEqual(0);
          expect(updatedAapl.changePercent).not.toEqual(0);
          expect(updatedAapl.high).toBeGreaterThanOrEqual(updatedAapl.price);
          expect(updatedAapl.low).toBeLessThanOrEqual(updatedAapl.price);
          expect(updatedAapl.volume).toBeGreaterThan(initialAapl.volume);
      });

       it('should add new points to history after interval', () => {
           const initialHistoryLength = service.getStockHistory('GOOGL').length;

           jest.advanceTimersByTime(5000 + 100); // Advance one interval

           const updatedHistory = service.getStockHistory('GOOGL');
           expect(updatedHistory.length).toBe(initialHistoryLength + 1);
           expect(updatedHistory[updatedHistory.length - 1].timestamp).toBeGreaterThan(updatedHistory[0].timestamp);
       });

       it('should limit history size', () => {
           const intervalsToRun = 110; // Set higher than MAX_HISTORY_POINTS
           jest.advanceTimersByTime(intervalsToRun * 5000 + 100);

           const history = service.getStockHistory('AMZN');
           // Expect history length to be capped at MAX_HISTORY_POINTS (100)
           expect(history.length).toBe(100);
       });
  });
});