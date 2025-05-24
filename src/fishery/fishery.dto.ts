import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateFisheryDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsString()
  @IsNotEmpty()
  fishery_type: string;

  @IsString()
  @IsNotEmpty()
  target_species: string;

  @IsString()
  @IsNotEmpty()
  feed_type: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFisheryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fishery_type?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  target_species?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  feed_type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResetFisheryDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
