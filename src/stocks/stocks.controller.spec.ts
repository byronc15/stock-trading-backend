// src/stocks/stocks.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { FullStockData, StockHistoryPoint } from './interfaces/stock.interface';
import { NotFoundException } from '@nestjs/common';

// Mock the StocksService dependency
const mockStocksService = {
  getAllSupportedStocks: jest.fn(),
  getStockData: jest.fn(),
  getStockHistory: jest.fn(), // Mock the new history method
};

describe('StocksController', () => {
  let controller: StocksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [
        { provide: StocksService, useValue: mockStocksService },
      ],
    }).compile();

    controller = module.get<StocksController>(StocksController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllStocks', () => {
    it('should return an array of full stock data from the service', async () => {
      // Mock data now includes more fields
      const mockStockList: FullStockData[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 190, change: 1, changePercent: 0.53, open: 189, high: 191, low: 188, volume: 100000, timestamp: Date.now() },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 180, change: -0.5, changePercent: -0.28, open: 180.5, high: 181, low: 179, volume: 120000, timestamp: Date.now() },
      ];
      mockStocksService.getAllSupportedStocks.mockResolvedValue(mockStockList); // Use mockResolvedValue for async methods

      const result = await controller.getAllStocks();

      expect(result).toEqual(mockStockList);
      expect(mockStocksService.getAllSupportedStocks).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSingleStockData', () => {
      it('should return full stock data for a valid symbol', async () => {
          const symbol = 'AAPL';
          const mockStock: FullStockData = { symbol: 'AAPL', name: 'Apple Inc.', price: 195, change: 2, changePercent: 1.03, open: 193, high: 196, low: 192, volume: 110000, timestamp: Date.now() };
          mockStocksService.getStockData.mockResolvedValue(mockStock); // Use mockResolvedValue

          const result = await controller.getSingleStockData(symbol);

          expect(result).toEqual(mockStock);
          expect(mockStocksService.getStockData).toHaveBeenCalledTimes(1);
          expect(mockStocksService.getStockData).toHaveBeenCalledWith(symbol.toUpperCase());
      });

      it('should throw NotFoundException if service throws it', async () => {
          const symbol = 'XYZ';
          mockStocksService.getStockData.mockRejectedValue(new NotFoundException(`Stock data not found for symbol: ${symbol}`)); // Simulate service throwing error

          await expect(controller.getSingleStockData(symbol)).rejects.toThrow(NotFoundException);
          expect(mockStocksService.getStockData).toHaveBeenCalledWith(symbol.toUpperCase());
      });
  });

   describe('getStockHistory', () => {
      it('should return an array of history points for a valid symbol', async () => {
          const symbol = 'AAPL';
          const mockHistory: StockHistoryPoint[] = [
              { timestamp: Date.now() - 10000, price: 194 },
              { timestamp: Date.now() - 5000, price: 194.5 },
              { timestamp: Date.now(), price: 195 },
          ];
          mockStocksService.getStockHistory.mockResolvedValue(mockHistory); // Use mockResolvedValue

          const result = await controller.getStockHistory(symbol);

          expect(result).toEqual(mockHistory);
          expect(mockStocksService.getStockHistory).toHaveBeenCalledTimes(1);
          expect(mockStocksService.getStockHistory).toHaveBeenCalledWith(symbol.toUpperCase());
      });

      it('should throw NotFoundException if service throws it for history', async () => {
          const symbol = 'XYZ';
          mockStocksService.getStockHistory.mockRejectedValue(new NotFoundException(`Stock history not found for symbol: ${symbol}`)); // Simulate service throwing error

          await expect(controller.getStockHistory(symbol)).rejects.toThrow(NotFoundException);
          expect(mockStocksService.getStockHistory).toHaveBeenCalledWith(symbol.toUpperCase());
      });
   });
});