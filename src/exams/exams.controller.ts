import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import {
  CreateQuestionDto,
  CreateQuestionsDto,
} from '../questions/dto/create-question.dto';
import { QuestionsService } from '../questions/questions.service';

@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsService: ExamsService,
    private readonly questionsService: QuestionsService,
  ) {}

  @Get()
  findAll(@Query('includeQuestions') includeQuestions?: boolean) {
    return this.examsService.findAll(includeQuestions);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Post()
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateExamDto: CreateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }

  @Post(':examId/questions')
  addQuestion(
    @Param('examId') examId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.examsService.addQuestion(examId, createQuestionDto);
  }

  @Post(':examId/questions/bulk')
  addQuestions(
    @Param('examId') examId: string,
    @Body() createQuestionsDto: CreateQuestionsDto,
  ) {
    return this.examsService.addQuestions(examId, createQuestionsDto);
  }

  @Post(':examId/questions')
  async addQuestionToExam(
    @Param('examId') examId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionsService.createQuestionForExam(
      examId,
      createQuestionDto,
    );
  }

  @Get(':examId/questions')
  async getExamQuestions(@Param('examId') examId: string) {
    const exam = await this.examsService.findOne(examId);
    return exam.questions || [];
  }
}
