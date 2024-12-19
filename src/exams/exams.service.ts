import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../config/firebase.config';
import { CreateExamDto } from './dto/create-exam.dto';
import * as admin from 'firebase-admin';
import {
  CreateQuestionDto,
  CreateQuestionsDto,
} from '../questions/dto/create-question.dto';

@Injectable()
export class ExamsService {
  private readonly examsRef: admin.database.Reference;

  constructor(private readonly firebaseService: FirebaseService) {
    this.examsRef = this.firebaseService.getDatabase().ref('exams');
  }

  async create(createExamDto: CreateExamDto) {
    try {
      const examData = {
        ...createExamDto,
        code: createExamDto.code || (await this.generateExamCode()),
        category: createExamDto.category || '其他',
        createdAt: admin.database.ServerValue.TIMESTAMP,
      };

      const newExamRef = this.examsRef.push();
      await newExamRef.set(examData);

      return { id: newExamRef.key, ...examData };
    } catch (error) {
      throw error;
    }
  }

  async findAll(includeQuestions = false) {
    const snapshot = await this.examsRef.once('value');
    const exams = snapshot.val() || {};
    return Object.entries(exams).map(([id, data]: [string, any]) => {
      const questions = data.questions || {};
      const questionNum = Object.keys(questions).length;
      return {
        id,
        ...data,
        questionNum,
        questions: includeQuestions ? questions : undefined,
      };
    });
  }

  async findOne(id: string) {
    const examSnapshot = await this.examsRef.child(id).once('value');
    if (!examSnapshot.exists()) {
      throw new NotFoundException('Exam not found');
    }

    const questionsSnapshot = await this.examsRef
      .child(id)
      .child('questions')
      .once('value');

    const questions = questionsSnapshot.val() || {};
    const questionsList = Object.entries(questions).map(
      ([qId, data]: [string, any]) => ({
        id: qId,
        ...data,
      }),
    );

    return {
      id,
      ...examSnapshot.val(),
      questions: questionsList,
    };
  }

  async update(id: string, updateData: Partial<CreateExamDto>) {
    try {
      const snapshot = await this.examsRef.child(id).once('value');
      if (!snapshot.exists()) {
        throw new NotFoundException('Exam not found');
      }

      const updatedData = {
        ...updateData,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      };

      await this.examsRef.child(id).update(updatedData);
      return this.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const snapshot = await this.examsRef.child(id).once('value');
      if (!snapshot.exists()) {
        throw new NotFoundException('Exam not found');
      }

      await this.examsRef.child(id).remove();
      return { message: 'Exam deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  private async generateExamCode(): Promise<string> {
    const snapshot = await this.examsRef.once('value');
    const exams = snapshot.val() || {};
    const existingCodes = Object.values(exams).map((exam: any) => exam.code);

    let code: string;
    do {
      // Generate a 6-digit code
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (existingCodes.includes(code));

    return code;
  }

  async addQuestion(examId: string, createQuestionDto: CreateQuestionDto) {
    const examRef = this.examsRef.child(examId);
    const questionsRef = examRef.child('questions');
    const newQuestionRef = questionsRef.push();
    await newQuestionRef.set(createQuestionDto);
    return { id: newQuestionRef.key, ...createQuestionDto };
  }

  async addQuestions(examId: string, createQuestionsDto: CreateQuestionsDto) {
    const examRef = this.examsRef.child(examId);
    const questionsRef = examRef.child('questions');
    const results = await Promise.all(
      createQuestionsDto.questions.map(async (question) => {
        const newQuestionRef = questionsRef.push();
        await newQuestionRef.set(question);
        return { id: newQuestionRef.key, ...question };
      }),
    );
    return results;
  }
}
