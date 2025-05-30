import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateInventoryDto {
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsString()
  @IsNotEmpty()
  item_name: string;

  @IsString()
  @IsNotEmpty()
  item_group: string;

  @IsString()
  @IsNotEmpty()
  units: string;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  quantity: number;

  @IsNumber({}, { message: 'Price per unit must be a number.' })
  @IsNotEmpty()
  @Min(0, { message: 'Price per unit cannot be negative.' })
  price_per_unit: number;

  @IsOptional()
  @IsInt()
  warehouse_id?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimum_limit?: number;

  @IsOptional()
  @IsBoolean()
  feed?: boolean;
}

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  item_name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  item_group?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  units?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Price per unit must be a number.' })
  @Min(0, { message: 'Price per unit cannot be negative.' })
  price_per_unit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimum_limit?: number;

  @IsOptional()
  @IsBoolean()
  feed?: boolean;
}

export class ResetInventoryDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
