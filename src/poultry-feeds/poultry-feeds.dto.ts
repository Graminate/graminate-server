import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreatePoultryFeedDto {
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsInt()
  @IsNotEmpty()
  flock_id: number;

  @IsString()
  @IsNotEmpty()
  feed_given: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  amount_given: number;

  @IsString()
  @IsNotEmpty()
  units: string;

  @IsDateString()
  @IsNotEmpty()
  feed_date: string;
}

export class UpdatePoultryFeedDto {
  @IsOptional()
  @IsString()
  feed_given?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount_given?: number;

  @IsOptional()
  @IsString()
  units?: string;

  @IsOptional()
  @IsDateString()
  feed_date?: string;
}

export class ResetPoultryFeedsDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
