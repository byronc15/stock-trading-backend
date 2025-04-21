import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { StocksService } from '../stocks/stocks.service';

// Mock service implementations for testing the controller in isolation
const mockPortfolioService = {
  getHoldingsMap: jest.fn().mockReturnValue({}),
  getPortfolio: jest.fn().mockResolvedValue({
      cash: 100000,
      holdings: [],
      totalValue: 100000,
  }),
};

const mockStocksService = {
  getStockData: jest.fn().mockResolvedValue(null),
};


describe('PortfolioController', () => {
  let controller: PortfolioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      // Provide mocks instead of real services
      providers: [
        { provide: PortfolioService, useValue: mockPortfolioService },
        { provide: StocksService, useValue: mockStocksService },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);

    // Reset mock function call history before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPortfolio', () => {
      it('should call portfolioService methods and return portfolio', async () => {
          const mockHoldings = { 'AAPL': 10 };
          const mockPrice = { symbol: 'AAPL', name: 'Apple Inc.', price: 150 };
          const mockCalculatedPortfolio = {
              cash: 98500,
              holdings: [{ symbol: 'AAPL', quantity: 10, price: 150, value: 1500 }],
              totalValue: 100000,
          };

          // Configure mocks for this specific test case
          mockPortfolioService.getHoldingsMap.mockReturnValue(mockHoldings);
          mockStocksService.getStockData.mockResolvedValue(mockPrice);
          mockPortfolioService.getPortfolio.mockReturnValue(mockCalculatedPortfolio);

          const result = await controller.getPortfolio();

          expect(mockPortfolioService.getHoldingsMap).toHaveBeenCalledTimes(1);
          expect(mockStocksService.getStockData).toHaveBeenCalledTimes(Object.keys(mockHoldings).length);
          expect(mockStocksService.getStockData).toHaveBeenCalledWith('AAPL');
          expect(mockPortfolioService.getPortfolio).toHaveBeenCalledTimes(1);
          expect(mockPortfolioService.getPortfolio).toHaveBeenCalledWith({ 'AAPL': 150 }); // Verify price map argument
          expect(result).toEqual(mockCalculatedPortfolio);
      });

      it('should handle cases with no holdings', async () => {
          const mockCalculatedPortfolio = { cash: 100000, holdings: [], totalValue: 100000 };
          mockPortfolioService.getHoldingsMap.mockReturnValue({});
          mockPortfolioService.getPortfolio.mockReturnValue(mockCalculatedPortfolio);

          const result = await controller.getPortfolio();

          expect(mockPortfolioService.getHoldingsMap).toHaveBeenCalledTimes(1);
          expect(mockStocksService.getStockData).not.toHaveBeenCalled(); // Should not fetch prices if no holdings
          expect(mockPortfolioService.getPortfolio).toHaveBeenCalledTimes(1);
          expect(mockPortfolioService.getPortfolio).toHaveBeenCalledWith({});
          expect(result).toEqual(mockCalculatedPortfolio);
      });
  });
});