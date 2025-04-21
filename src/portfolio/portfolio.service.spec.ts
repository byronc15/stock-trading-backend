import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfolioService],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);

    // Manually reset state before each test as service is stateful
    (service as any).cash = 100000;
    (service as any).holdings = {};
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initial State', () => {
    it('should start with $100,000 cash', () => {
      expect(service.getCash()).toBe(100000);
    });

    it('should start with empty holdings map', () => {
      expect(service.getHoldingsMap()).toEqual({});
    });
  });

  describe('updateCash', () => {
    it('should correctly add cash', () => {
      service.updateCash(500);
      expect(service.getCash()).toBe(100500);
    });

    it('should correctly subtract cash', () => {
      service.updateCash(-1000);
      expect(service.getCash()).toBe(99000);
    });
  });

  describe('updateHoldings', () => {
    it('should add new stock holdings correctly', () => {
      service.updateHoldings('AAPL', 10);
      expect(service.getHoldingsMap()).toEqual({ AAPL: 10 });
    });

    it('should increase quantity of existing stock holdings', () => {
      service.updateHoldings('AAPL', 10);
      service.updateHoldings('AAPL', 5);
      expect(service.getHoldingsMap()).toEqual({ AAPL: 15 });
    });

    it('should decrease quantity of existing stock holdings', () => {
      service.updateHoldings('MSFT', 20);
      service.updateHoldings('MSFT', -5);
      expect(service.getHoldingsMap()).toEqual({ MSFT: 15 });
    });

    it('should remove stock from holdings if quantity reaches zero', () => {
      service.updateHoldings('TSLA', 10);
      service.updateHoldings('TSLA', -10);
      expect(service.getHoldingsMap()).toEqual({});
    });

     it('should remove stock from holdings if quantity becomes negative', () => {
       service.updateHoldings('GOOGL', 5);
       service.updateHoldings('GOOGL', -10); // Trade validation should prevent this, but service handles it
       expect(service.getHoldingsMap()).toEqual({});
     });
  });

  describe('getPortfolio', () => {
     it('should calculate portfolio value correctly with holdings', () => {
       service.updateHoldings('AAPL', 10);
       service.updateCash(-1500); // Simulate cash change from trade
       const currentPrices = { 'AAPL': 190 };

       const portfolio = service.getPortfolio(currentPrices);

       expect(portfolio.cash).toBe(98500);
       expect(portfolio.holdings).toHaveLength(1);
       expect(portfolio.holdings[0]).toEqual({
         symbol: 'AAPL',
         quantity: 10,
         price: 190,
         value: 1900,
       });
       expect(portfolio.totalValue).toBe(100400); // 98500 + 1900
     });

     it('should calculate portfolio value correctly with no holdings', () => {
       const currentPrices = {};
       const portfolio = service.getPortfolio(currentPrices);
       expect(portfolio.cash).toBe(100000);
       expect(portfolio.holdings).toHaveLength(0);
       expect(portfolio.totalValue).toBe(100000);
     });

     it('should handle missing prices for held stocks gracefully', () => {
        service.updateHoldings('XYZ', 5);
        const currentPrices = { 'ABC': 100 }; // Price missing for held stock XYZ
        const portfolio = service.getPortfolio(currentPrices);

        expect(portfolio.holdings).toHaveLength(1);
        expect(portfolio.holdings[0].symbol).toBe('XYZ');
        expect(portfolio.holdings[0].price).toBe(0); // Expect price/value to be 0
        expect(portfolio.holdings[0].value).toBe(0);
        expect(portfolio.totalValue).toBe(service.getCash()); // Total value should only reflect cash
     });
  });
});