import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { QuestionType } from '../enums/question-type.enum';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  options: string[];

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsArray()
  answer: string[];
}

export class CreateQuestionsDto {
  @IsArray()
  questions: CreateQuestionDto[];
}
