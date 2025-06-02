import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateCattleMilkDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  cattle_id: number;

  @IsDateString()
  @IsNotEmpty()
  date_collected: string;

  @IsOptional()
  @IsString()
  animal_name?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  milk_produced: number;
}

export class UpdateCattleMilkDto {
  @IsOptional()
  @IsDateString()
  date_collected?: string;

  @IsOptional()
  @IsString()
  animal_name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  milk_produced?: number;
}

export class ResetCattleMilkDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
