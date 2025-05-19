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
}

export class ResetFlockDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
