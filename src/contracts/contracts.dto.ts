import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContractDto {
  @IsNotEmpty({ message: 'User ID is required' })
  @IsInt({ message: 'User ID must be an integer' })
  @Min(1, { message: 'User ID must be a positive integer' })
  @Type(() => Number)
  user_id: number;

  @IsNotEmpty({ message: 'Deal name is required' })
  @IsString()
  @MaxLength(150, { message: 'Deal name cannot exceed 150 characters' })
  deal_name: string;

  @IsNotEmpty({ message: 'Partner name is required' })
  @IsString()
  @MaxLength(100, { message: 'Partner name cannot exceed 100 characters' })
  partner: string;

  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Type(() => Number)
  amount: number;

  @IsNotEmpty({ message: 'Stage is required' })
  @IsString()
  @MaxLength(50, { message: 'Stage cannot exceed 50 characters' })
  stage: string;

  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string' },
  )
  start_date: string;

  @IsOptional()
  @ValidateIf((o) => o.end_date !== null)
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string or null' },
  )
  end_date?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Category cannot exceed 100 characters' })
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Priority must be Low, Medium, or High' })
  priority?: string;
}

export class UpdateContractDto {
  @IsNotEmpty({ message: 'Contract ID (id) is required' })
  @IsInt({ message: 'Contract ID must be an integer' })
  @Min(1, { message: 'Contract ID must be a positive integer' })
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Deal name cannot exceed 150 characters' })
  deal_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Partner name cannot exceed 100 characters' })
  partner?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Amount must be a number' })
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Stage cannot exceed 50 characters' })
  stage?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string' },
  )
  start_date?: string;

  @IsOptional()
  @ValidateIf((o) => o.end_date !== null)
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string or null' },
  )
  end_date?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Category cannot exceed 100 characters' })
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Priority must be Low, Medium, or High' })
  priority?: string;
}
