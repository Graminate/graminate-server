import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateCattleRearingDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsString()
  @IsNotEmpty()
  cattle_name: string;

  @IsString()
  @IsNotEmpty()
  cattle_type: string;

  @IsNumber()
  @IsNotEmpty()
  number_of_animals: number;

  @IsOptional()
  @IsString()
  purpose?: string;
}

export class UpdateCattleRearingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cattle_name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cattle_type?: string;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  number_of_animals?: number;

  @IsOptional()
  @IsString()
  purpose?: string;
}

export class ResetCattleRearingDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
