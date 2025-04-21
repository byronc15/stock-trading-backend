import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StocksModule } from './stocks/stocks.module';
import { TradesModule } from './trades/trades.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
        isGlobal: true,
    }),
    StocksModule,
    TradesModule,
    PortfolioModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}