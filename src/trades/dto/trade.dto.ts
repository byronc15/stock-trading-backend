import { IsIn, IsInt, IsNotEmpty, IsPositive, IsString, IsUppercase, Min } from 'class-validator';

export class TradeDto {
  @IsString()
  @IsNotEmpty({ message: 'Symbol cannot be empty.' })
  @IsUppercase({ message: 'Symbol must be uppercase.' }) // Ensures consistency
  symbol: string;

  @IsInt({ message: 'Quantity must be an integer.' })
  @Min(1, { message: 'Quantity must be at least 1.' }) // Replaces IsPositive for more specific message
  quantity: number;

  @IsIn(['buy', 'sell'], { message: 'Side must be either "buy" or "sell".' })
  side: 'buy' | 'sell';
}