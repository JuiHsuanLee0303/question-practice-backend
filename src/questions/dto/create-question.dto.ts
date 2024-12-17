import { IsString, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  examId: string;

  @IsString()
  examName: string;

  @IsString()
  @IsOptional()
  chapterNum?: string;

  @IsString()
  @IsOptional()
  chapterName?: string;

  @IsString()
  questionNum: string;

  @IsString()
  content: string;

  @IsArray()
  options: string[];

  @IsBoolean()
  isMultiple: boolean;

  @IsArray()
  answer: string[];
}
