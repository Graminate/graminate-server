import {
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsString,
  IsDateString,
  IsInt,
} from 'class-validator';

export class CreateTaskDto {
  @IsInt()
  user_id: number;

  @IsNotEmpty()
  @IsString()
  project: string;

  @IsNotEmpty()
  @IsString()
  task: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['Low', 'Medium', 'High'])
  priority: string;

  @IsOptional()
  @IsDateString()
  deadline?: string; // ISO date string format
}

export class UpdateTaskDto {
  @IsOptional()
  @IsInt()
  user_id?: number;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  task?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Low', 'Medium', 'High'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class ResetTaskDto {
  userId: number;
}
