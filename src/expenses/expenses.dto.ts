import {
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  IsPositive,
} from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsInt()
  user_id: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  category: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  expense: number;

  @IsNotEmpty()
  @IsDateString()
  date_created: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  expense?: number;

  @IsOptional()
  @IsDateString()
  date_created?: string;
}

export class DeleteExpensesByOccupationDto {
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsString()
  occupation: string;
}
