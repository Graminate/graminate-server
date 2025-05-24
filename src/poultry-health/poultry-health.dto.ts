import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';

export class CreatePoultryHealthDto {
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsInt()
  @IsNotEmpty()
  flock_id: number;

  @IsOptional()
  @IsString()
  veterinary_name?: string;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  total_birds: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  birds_vaccinated: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vaccines_given?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicine_approved?: string[];

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsDateString()
  next_appointment?: string;
}

export class UpdatePoultryHealthDto {
  @IsOptional()
  @IsString()
  veterinary_name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_birds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  birds_vaccinated?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vaccines_given?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicine_approved?: string[];

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsDateString()
  next_appointment?: string;
}

export class ResetPoultryHealthDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
