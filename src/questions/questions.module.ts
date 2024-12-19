import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { FirebaseService } from '../config/firebase.config';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, FirebaseService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
