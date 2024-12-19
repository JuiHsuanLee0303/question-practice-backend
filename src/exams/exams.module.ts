import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { QuestionsModule } from '../questions/questions.module';
import { FirebaseService } from '../config/firebase.config';

@Module({
  imports: [QuestionsModule],
  controllers: [ExamsController],
  providers: [ExamsService, FirebaseService],
})
export class ExamsModule {}
