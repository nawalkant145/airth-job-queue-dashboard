import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(120, { message: 'Title must not exceed 120 characters' })
  title: string;

  @IsString({ message: 'Type must be a string' })
  @IsNotEmpty({ message: 'Type is required' })
  @MaxLength(120, { message: 'Type must not exceed 120 characters' })
  type: string;
}
