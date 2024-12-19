import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  questionId: string;
  answer: string[];
}

export class CreateExamResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsNumber()
  timeSpent: number;
}
