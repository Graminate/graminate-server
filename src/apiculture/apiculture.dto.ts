import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateApiaryDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsString()
  @IsNotEmpty()
  apiary_name: string;

  @IsOptional()
  @IsString()
  address_line_1?: string;

  @IsOptional()
  @IsString()
  address_line_2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsNumber()
  area?: number;
}

export class UpdateApiaryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  apiary_name?: string;

  @IsOptional()
  @IsString()
  address_line_1?: string;

  @IsOptional()
  @IsString()
  address_line_2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsNumber()
  area?: number;
}

export class ResetApicultureDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
