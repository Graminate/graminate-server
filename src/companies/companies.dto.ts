import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  @MaxLength(100)
  company_name: string;

  @IsNotEmpty()
  @MaxLength(50)
  owner_name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsNotEmpty()
  @Matches(/^\+?[1-9][0-9]{1,14}$/, {
    message: 'Phone number must be in E.164 format',
  })
  phone_number: string;

  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @IsNotEmpty()
  @MaxLength(255)
  address_line_1: string;

  @IsOptional()
  @MaxLength(255)
  address_line_2?: string;

  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsNotEmpty()
  @MaxLength(10)
  postal_code: string;
}
