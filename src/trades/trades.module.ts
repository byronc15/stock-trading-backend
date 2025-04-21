import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [PortfolioModule, StocksModule],
  providers: [TradesService],
  controllers: [TradesController],
})
export class TradesModule {}