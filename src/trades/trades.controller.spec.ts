import { Test, TestingModule } from '@nestjs/testing';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { TradeDto } from './dto/trade.dto';
import { BadRequestException } from '@nestjs/common';

// Mock the TradesService dependency
const mockTradesService = {
  executeTrade: jest.fn(),
};

describe('TradesController', () => {
  let controller: TradesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradesController],
      providers: [
        // Provide the mock service for injection
        { provide: TradesService, useValue: mockTradesService },
      ],
    }).compile();

    controller = module.get<TradesController>(TradesController);
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('trade', () => {
    it('should call tradesService.executeTrade and return the result on success', async () => {
        const tradeDto: TradeDto = { symbol: 'AAPL', quantity: 5, side: 'buy' };
        const expectedResult = {
            message: 'Trade successful: BUY 5 AAPL',
            symbol: 'AAPL',
            quantity: 5,
            side: 'buy',
        };
        mockTradesService.executeTrade.mockResolvedValue(expectedResult);

        const result = await controller.trade(tradeDto);

        expect(result).toEqual(expectedResult);
        expect(mockTradesService.executeTrade).toHaveBeenCalledTimes(1);
        expect(mockTradesService.executeTrade).toHaveBeenCalledWith(tradeDto);
    });

     it('should propagate exceptions thrown by tradesService.executeTrade', async () => {
         const tradeDto: TradeDto = { symbol: 'MSFT', quantity: 10, side: 'sell' };
         const errorMessage = 'Insufficient shares.';
         mockTradesService.executeTrade.mockRejectedValue(new BadRequestException(errorMessage));

         // Expect the controller method to reject with the same error as the service
         await expect(controller.trade(tradeDto)).rejects.toThrow(BadRequestException);
         await expect(controller.trade(tradeDto)).rejects.toThrow(errorMessage);
         expect(mockTradesService.executeTrade).toHaveBeenCalledWith(tradeDto);
     });
  });
});