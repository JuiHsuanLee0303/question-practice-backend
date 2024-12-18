import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../config/firebase.config';
import { CreateQuestionDto } from './dto/create-question.dto';
import { Chapter } from './interfaces/chapter.interface';
import * as admin from 'firebase-admin';

@Injectable()
export class QuestionsService {
  private readonly questionsRef: admin.database.Reference;

  constructor(private readonly firebaseService: FirebaseService) {
    this.questionsRef = this.firebaseService.getDatabase().ref('questions');
  }

  async create(createQuestionDto: CreateQuestionDto | CreateQuestionDto[]) {
    try {
      if (Array.isArray(createQuestionDto)) {
        const questionsToCreate = createQuestionDto[0]?.questions
          ? createQuestionDto[0].questions
          : createQuestionDto;

        const results = await Promise.all(
          questionsToCreate.map(async (question) => {
            const newQuestionRef = this.questionsRef.push();
            await newQuestionRef.set({
              createdAt: admin.database.ServerValue.TIMESTAMP,
              question: question,
            });
            return { id: newQuestionRef.key, ...question };
          }),
        );
        return results;
      } else {
        const newQuestionRef = this.questionsRef.push();
        await newQuestionRef.set({
          createdAt: admin.database.ServerValue.TIMESTAMP,
          question: createQuestionDto,
        });
        return { id: newQuestionRef.key, ...createQuestionDto };
      }
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    const snapshot = await this.questionsRef.once('value');
    const questions = snapshot.val() || {};
    return Object.entries(questions).map(([id, data]: [string, any]) => ({
      id,
      ...data.question,
      createdAt: data.createdAt,
    }));
  }

  async findAllExams() {
    const snapshot = await this.questionsRef.once('value');
    const questions = snapshot.val() || {};
    const exams = new Map();

    Object.values(questions).forEach((data: any) => {
      const question = data.question;
      if (!exams.has(question.examId)) {
        exams.set(question.examId, {
          examId: question.examId,
          examName: question.examName,
          questionCount: 1,
        });
      } else {
        const exam = exams.get(question.examId);
        exam.questionCount++;
      }
    });

    return Array.from(exams.values());
  }

  async getQuestionBanks() {
    const snapshot = await this.questionsRef.once('value');
    const questions = snapshot.val() || {};
    const exams = new Map();

    Object.values(questions).forEach((data: any) => {
      const question = data.question;
      if (!exams.has(question.examId)) {
        exams.set(question.examId, {
          examId: question.examId,
          examName: question.examName,
          questionCount: 1,
          chapters: new Map(),
          multipleChoiceCount: question.isMultiple ? 1 : 0,
          singleChoiceCount: question.isMultiple ? 0 : 1,
        });
        if (question.chapterNum && question.chapterName) {
          exams.get(question.examId).chapters.set(question.chapterNum, {
            chapterNum: question.chapterNum,
            chapterName: question.chapterName,
            questionCount: 1,
            multipleChoiceCount: question.isMultiple ? 1 : 0,
            singleChoiceCount: question.isMultiple ? 0 : 1,
          });
        }
      } else {
        const exam = exams.get(question.examId);
        exam.questionCount++;
        if (question.isMultiple) {
          exam.multipleChoiceCount++;
        } else {
          exam.singleChoiceCount++;
        }

        if (question.chapterNum && question.chapterName) {
          if (!exam.chapters.has(question.chapterNum)) {
            exam.chapters.set(question.chapterNum, {
              chapterNum: question.chapterNum,
              chapterName: question.chapterName,
              questionCount: 1,
              multipleChoiceCount: question.isMultiple ? 1 : 0,
              singleChoiceCount: question.isMultiple ? 0 : 1,
            });
          } else {
            const chapter = exam.chapters.get(question.chapterNum);
            chapter.questionCount++;
            if (question.isMultiple) {
              chapter.multipleChoiceCount++;
            } else {
              chapter.singleChoiceCount++;
            }
          }
        }
      }
    });

    const result = Array.from(exams.values()).map((exam) => ({
      ...exam,
      chapters: Array.from(exam.chapters.values()).sort((a, b) =>
        (a as Chapter).chapterNum.localeCompare(
          (b as Chapter).chapterNum,
          undefined,
          { numeric: true },
        ),
      ),
    }));

    return result;
  }

  async getExamChapters(examId: string) {
    const snapshot = await this.questionsRef
      .orderByChild('question/examId')
      .equalTo(examId)
      .once('value');
    const questions = snapshot.val() || {};
    console.log('Getting chapters for exam:', examId);

    const chapters = new Map<string, Chapter>();
    const DEFAULT_CHAPTER = 'other';

    Object.values(questions).forEach((data: any) => {
      console.log('Processing question:', data);
      const question = data.question;
      let targetChapterNum = DEFAULT_CHAPTER;
      let targetChapterName = '其他';

      if (question.chapterNum) {
        targetChapterNum = question.chapterNum;
        targetChapterName =
          question.chapterName || `第${question.chapterNum}章`;
      }

      if (!chapters.has(targetChapterNum)) {
        console.log('Adding new chapter:', targetChapterNum);
        chapters.set(targetChapterNum, {
          chapterNum: targetChapterNum,
          chapterName: targetChapterName,
          questionCount: 1,
          multipleChoiceCount: question.isMultiple ? 1 : 0,
          singleChoiceCount: question.isMultiple ? 0 : 1,
        });
      } else {
        const chapter = chapters.get(targetChapterNum);
        chapter.questionCount++;
        if (question.isMultiple) {
          chapter.multipleChoiceCount++;
        } else {
          chapter.singleChoiceCount++;
        }
      }
    });

    const result = Array.from(chapters.values()).sort((a, b) => {
      if (a.chapterNum === 'other') return 1;
      if (b.chapterNum === 'other') return -1;
      return a.chapterNum.localeCompare(b.chapterNum, undefined, {
        numeric: true,
      });
    });

    console.log('Chapters result:', JSON.stringify(result, null, 2));
    return result;
  }

  async findOne(id: string) {
    const snapshot = await this.questionsRef.child(id).once('value');
    if (!snapshot.exists()) {
      throw new NotFoundException('Question not found');
    }
    const data = snapshot.val();
    return {
      id,
      ...data.question,
      createdAt: data.createdAt,
    };
  }

  async update(id: string, updateData: Partial<CreateQuestionDto>) {
    try {
      const currentData = await this.findOne(id);
      await this.questionsRef.child(id).update({
        question: { ...currentData, ...updateData },
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      });
      return this.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.questionsRef.child(id).remove();
      return { message: 'Question deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async findByExam(examId: string) {
    const snapshot = await this.questionsRef
      .orderByChild('question/examId')
      .equalTo(examId)
      .once('value');
    const questions = snapshot.val() || {};
    return Object.entries(questions).map(([id, data]: [string, any]) => ({
      id,
      ...data.question,
      createdAt: data.createdAt,
    }));
  }

  async findByChapter(examId: string, chapterNum: string) {
    const snapshot = await this.questionsRef
      .orderByChild('question/examId')
      .equalTo(examId)
      .once('value');
    const questions = snapshot.val() || {};
    return Object.entries(questions)
      .filter(
        ([, data]: [string, any]) => data.question.chapterNum === chapterNum,
      )
      .map(([id, data]: [string, any]) => ({
        id,
        ...data.question,
        createdAt: data.createdAt,
      }));
  }

  async findRandom(examId?: string, limit: number = 1) {
    let snapshot: admin.database.DataSnapshot;
    if (examId) {
      snapshot = await this.questionsRef
        .orderByChild('question/examId')
        .equalTo(examId)
        .once('value');
    } else {
      snapshot = await this.questionsRef.once('value');
    }
    const questions = snapshot.val();
    if (!questions) {
      return [];
    }

    const questionArray = Object.entries(questions).map(
      ([id, data]: [string, any]) => ({
        id,
        ...data.question,
        createdAt: data.createdAt,
      }),
    );
    const shuffled = questionArray.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }
}
