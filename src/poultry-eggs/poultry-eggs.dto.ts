import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreatePoultryEggDto {
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsInt()
  @IsNotEmpty()
  flock_id: number;

  @IsNotEmpty()
  @IsDateString()
  date_collected: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  small_eggs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  medium_eggs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  large_eggs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  extra_large_eggs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  broken_eggs?: number;
}

export class UpdatePoultryEggDto {
  @IsOptional()
  @IsDateString()
  date_collected?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  small_eggs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  medium_eggs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  large_eggs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  extra_large_eggs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  broken_eggs?: number;
}

export class ResetPoultryEggDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
