import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  options: string[];

  @IsArray()
  correctOptions: string[];

  @IsString()
  category: string;

  @IsNumber()
  @IsOptional()
  difficulty?: number;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
