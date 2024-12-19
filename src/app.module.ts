import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { QuestionsModule } from './questions/questions.module';
import { RecordsModule } from './records/records.module';
import { FirebaseModule } from './config/firebase.module';
import { ExamsModule } from './exams/exams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule,
    UsersModule,
    AuthModule,
    QuestionsModule,
    RecordsModule,
    ExamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
