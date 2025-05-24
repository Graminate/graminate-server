import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  housing_type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
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
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  housing_type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResetFlockDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
