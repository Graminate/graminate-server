import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateFlockDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsString()
  @IsNotEmpty()
  flock_name: string;

  @IsString()
  @IsNotEmpty()
  flock_type: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsDateString()
  @IsNotEmpty()
  date_created: string;
}

export class UpdateFlockDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  flock_name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  flock_type?: string;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  quantity?: number;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  date_created?: string;
}

export class ResetFlockDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
