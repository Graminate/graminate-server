import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUrl,
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
  contact_person: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @Matches(/^\+?[1-9][0-9]{1,14}$/, {
    message: 'Phone number must be in E.164 format',
  })
  phone_number?: string;

  @IsOptional()
  @MaxLength(50)
  type?: string;

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

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @MaxLength(50)
  industry?: string;
}
