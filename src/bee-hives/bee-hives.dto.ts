import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateHiveDto {
  @IsNumber()
  @IsNotEmpty()
  apiary_id: number;

  @IsString()
  @IsNotEmpty()
  hive_name: string;

  @IsOptional() @IsString() hive_type?: string;
  @IsOptional() @IsString() bee_species?: string;
  @IsOptional() @IsDateString() installation_date?: Date | string;
  @IsOptional() @IsString() queen_status?: string;
  @IsOptional() @IsDateString() queen_introduced_date?: Date | string;
  @IsOptional() @IsDateString() last_inspection_date?: Date | string;
  @IsOptional() @IsString() brood_pattern?: string;
  @IsOptional() @IsNumber() honey_stores_kg?: number;
  @IsOptional() @IsBoolean() pest_infestation?: boolean;
  @IsOptional() @IsBoolean() disease_detected?: boolean;
  @IsOptional() @IsBoolean() swarm_risk?: boolean;
  @IsOptional() @IsString() ventilation_status?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateHiveDto {
  @IsOptional() @IsString() @IsNotEmpty() hive_name?: string;
  @IsOptional() @IsString() hive_type?: string;
  @IsOptional() @IsString() bee_species?: string;
  @IsOptional() @IsDateString() installation_date?: Date | string;
  @IsOptional() @IsString() queen_status?: string;
  @IsOptional() @IsDateString() queen_introduced_date?: Date | string;
  @IsOptional() @IsDateString() last_inspection_date?: Date | string;
  @IsOptional() @IsString() brood_pattern?: string;
  @IsOptional() @IsNumber() honey_stores_kg?: number;
  @IsOptional() @IsBoolean() pest_infestation?: boolean;
  @IsOptional() @IsBoolean() disease_detected?: boolean;
  @IsOptional() @IsBoolean() swarm_risk?: boolean;
  @IsOptional() @IsString() ventilation_status?: string;
  @IsOptional() @IsString() notes?: string;
}

export class ResetHivesDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
