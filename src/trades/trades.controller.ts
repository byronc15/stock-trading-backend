import { Body, Controller, Post, Logger } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradeDto } from './dto/trade.dto';

@Controller('trade')
export class TradesController {
  private readonly logger = new Logger(TradesController.name);

  constructor(private readonly tradesService: TradesService) {}

  @Post()
  async trade(@Body() tradeDto: TradeDto) {
    // DTO validation is handled by the global ValidationPipe defined in main.ts
    this.logger.log(`Trade request received: ${JSON.stringify(tradeDto)}`);
    return this.tradesService.executeTrade(tradeDto);
  }
}