import { Test, TestingModule } from '@nestjs/testing';
import { TradesService } from './trades.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { StocksService, StockData } from '../stocks/stocks.service';
import { TradeDto } from './dto/trade.dto';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

// Mock service dependencies
const mockStocksService = {
  getStockData: jest.fn(),
};

const mockPortfolioService = {
  getCash: jest.fn(),
  getHoldingsMap: jest.fn(),
  updateCash: jest.fn(),
  updateHoldings: jest.fn(),
};

describe('TradesService', () => {
  let service: TradesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradesService,
        // Provide mocks for dependencies
        { provide: PortfolioService, useValue: mockPortfolioService },
        { provide: StocksService, useValue: mockStocksService },
      ],
    }).compile();

    service = module.get<TradesService>(TradesService);

    jest.clearAllMocks(); // Reset mocks before each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Buy Trade Scenarios ---
  describe('executeTrade (Buy)', () => {
    const buyTradeDto: TradeDto = { symbol: 'AAPL', quantity: 10, side: 'buy' };
    const stockData: StockData = { symbol: 'AAPL', name: 'Apple Inc.', price: 200 };

    it('should execute a buy trade successfully', async () => {
      mockStocksService.getStockData.mockResolvedValue(stockData);
      mockPortfolioService.getCash.mockReturnValue(100000); // Setup sufficient cash

      const result = await service.executeTrade(buyTradeDto);

      expect(mockStocksService.getStockData).toHaveBeenCalledWith('AAPL');
      expect(mockPortfolioService.getCash).toHaveBeenCalled();
      expect(mockPortfolioService.updateCash).toHaveBeenCalledWith(-2000);
      expect(mockPortfolioService.updateHoldings).toHaveBeenCalledWith('AAPL', 10);
      expect(result).toEqual({
          message: 'Trade successful: BUY 10 AAPL',
          symbol: 'AAPL',
          quantity: 10,
          side: 'buy',
      });
    });

    it('should throw BadRequestException if insufficient funds for buy', async () => {
      mockStocksService.getStockData.mockResolvedValue(stockData);
      mockPortfolioService.getCash.mockReturnValue(1000); // Setup insufficient cash

      await expect(service.executeTrade(buyTradeDto)).rejects.toThrow(BadRequestException);
      await expect(service.executeTrade(buyTradeDto)).rejects.toThrow(
        'Insufficient funds. Need $2000.00, but only have $1000.00.'
      );
      expect(mockPortfolioService.updateCash).not.toHaveBeenCalled();
      expect(mockPortfolioService.updateHoldings).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if stock symbol is not supported', async () => {
        mockStocksService.getStockData.mockResolvedValue(null); // Setup unsupported symbol response

        await expect(service.executeTrade({ ...buyTradeDto, symbol: 'XYZ' })).rejects.toThrow(NotFoundException);
        await expect(service.executeTrade({ ...buyTradeDto, symbol: 'XYZ' })).rejects.toThrow(
            'Stock symbol "XYZ" is not supported for trading.'
        );
    });

     it('should throw InternalServerErrorException if stock price is invalid/null', async () => {
         mockStocksService.getStockData.mockResolvedValue({ ...stockData, price: null }); // Setup invalid price response

         await expect(service.executeTrade(buyTradeDto)).rejects.toThrow(InternalServerErrorException);
         await expect(service.executeTrade(buyTradeDto)).rejects.toThrow(
             'Could not retrieve a valid price for AAPL. Trade cancelled.'
         );
     });
  });

  // --- Sell Trade Scenarios ---
  describe('executeTrade (Sell)', () => {
    const sellTradeDto: TradeDto = { symbol: 'MSFT', quantity: 5, side: 'sell' };
    const stockData: StockData = { symbol: 'MSFT', name: 'Microsoft Corp.', price: 400 };

    it('should execute a sell trade successfully', async () => {
      mockStocksService.getStockData.mockResolvedValue(stockData);
      mockPortfolioService.getHoldingsMap.mockReturnValue({ 'MSFT': 10 }); // Setup sufficient shares owned

      const result = await service.executeTrade(sellTradeDto);

      expect(mockStocksService.getStockData).toHaveBeenCalledWith('MSFT');
      expect(mockPortfolioService.getHoldingsMap).toHaveBeenCalled();
      expect(mockPortfolioService.updateCash).toHaveBeenCalledWith(2000);
      expect(mockPortfolioService.updateHoldings).toHaveBeenCalledWith('MSFT', -5);
       expect(result).toEqual({
           message: 'Trade successful: SELL 5 MSFT',
           symbol: 'MSFT',
           quantity: 5,
           side: 'sell',
       });
    });

    it('should throw BadRequestException if insufficient shares for sell', async () => {
       mockStocksService.getStockData.mockResolvedValue(stockData);
       mockPortfolioService.getHoldingsMap.mockReturnValue({ 'MSFT': 3 }); // Setup insufficient shares owned

       await expect(service.executeTrade(sellTradeDto)).rejects.toThrow(BadRequestException);
       await expect(service.executeTrade(sellTradeDto)).rejects.toThrow(
           'Insufficient shares. Trying to sell 5 MSFT, but only own 3.'
       );
       expect(mockPortfolioService.updateCash).not.toHaveBeenCalled();
       expect(mockPortfolioService.updateHoldings).not.toHaveBeenCalled();
    });

     it('should throw BadRequestException if trying to sell shares not owned', async () => {
       mockStocksService.getStockData.mockResolvedValue(stockData);
       mockPortfolioService.getHoldingsMap.mockReturnValue({ 'AAPL': 10 }); // Setup zero shares of target stock

       await expect(service.executeTrade(sellTradeDto)).rejects.toThrow(BadRequestException);
       await expect(service.executeTrade(sellTradeDto)).rejects.toThrow(
         'Insufficient shares. Trying to sell 5 MSFT, but only own 0.'
       );
     });
  });
});