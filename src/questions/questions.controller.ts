import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles('admin')
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  @Get('exams')
  findAllExams() {
    return this.questionsService.findAllExams();
  }

  @Get('exams/:examId')
  findQuestionsByExam(@Param('examId') examId: string) {
    return this.questionsService.findByExam(examId);
  }

  @Get('random')
  findRandom(@Query('examId') examId?: string, @Query('limit') limit?: number) {
    return this.questionsService.findRandom(examId, limit);
  }

  @Get('exam/:examId')
  findByExam(@Param('examId') examId: string) {
    return this.questionsService.findByExam(examId);
  }

  @Get('exam/:examId/chapter/:chapterNum')
  findByChapter(
    @Param('examId') examId: string,
    @Param('chapterNum') chapterNum: string,
  ) {
    return this.questionsService.findByChapter(examId, chapterNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: Partial<CreateQuestionDto>,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
