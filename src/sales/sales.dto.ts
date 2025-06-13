import {
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
  IsOptional,
  Min,
  MaxLength,
  IsNumber,
  IsPositive,
  ValidateIf,
} from 'class-validator';

export class CreateSaleDto {
  @IsNotEmpty()
  @IsInt()
  user_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sales_name?: string;

  @IsNotEmpty()
  @IsDateString()
  sales_date: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  items_sold: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  quantities_sold: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({ maxDecimalPlaces: 2 }, { each: true })
  @IsPositive({ each: true })
  @ValidateIf(
    (o) => o.prices_per_unit !== undefined && o.prices_per_unit.length > 0,
  )
  prices_per_unit?: number[];

  @IsOptional()
  @IsString()
  quantity_unit?: string;

  @IsOptional()
  @IsBoolean()
  invoice_created?: boolean;
}

export class UpdateSaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sales_name?: string;

  @IsOptional()
  @IsDateString()
  sales_date?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  items_sold?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  quantities_sold?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({ maxDecimalPlaces: 2 }, { each: true })
  @IsPositive({ each: true })
  @ValidateIf((o) => o.prices_per_unit !== undefined)
  prices_per_unit?: number[];

  @IsOptional()
  @IsString()
  quantity_unit?: string;

  @IsOptional()
  @IsBoolean()
  invoice_created?: boolean;
}

export class ResetSalesDto {
  @IsNotEmpty()
  @IsInt()
  userId: number;
}

export class DeleteSalesByOccupationDto {
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsString()
  occupation: string;
}
