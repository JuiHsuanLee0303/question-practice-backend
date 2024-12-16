import { IsString, IsNumber, IsArray, IsBoolean } from 'class-validator';

export class CreateRecordDto {
  @IsString()
  userId: string;

  @IsString()
  questionId: string;

  @IsArray()
  selectedOptions: string[];

  @IsBoolean()
  isCorrect: boolean;

  @IsNumber()
  timeSpent: number; // in seconds

  @IsString()
  category: string;
}
