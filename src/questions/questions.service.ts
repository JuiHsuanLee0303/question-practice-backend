import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../config/firebase.config';
import { CreateQuestionDto } from './dto/create-question.dto';
import { Chapter } from './interfaces/chapter.interface';
import { QuestionType } from './enums/question-type.enum';
import * as admin from 'firebase-admin';
import { CreateExamResultDto } from '../exam-results/dto/create-exam-result.dto';

@Injectable()
export class QuestionsService {
  private readonly questionsRef: admin.database.Reference;
  private readonly examsRef: admin.database.Reference;

  constructor(private readonly firebaseService: FirebaseService) {
    this.questionsRef = this.firebaseService.getDatabase().ref('questions');
    this.examsRef = this.firebaseService.getDatabase().ref('exams');
  }

  async create(createQuestionDto: CreateQuestionDto | CreateQuestionDto[]) {
    try {
      if (Array.isArray(createQuestionDto)) {
        const results = await Promise.all(
          createQuestionDto.map(async (question) => {
            const newQuestionRef = this.questionsRef.push();
            await newQuestionRef.set({
              createdAt: admin.database.ServerValue.TIMESTAMP,
              ...question,
            });
            return { id: newQuestionRef.key, ...question };
          }),
        );
        return results;
      } else {
        const newQuestionRef = this.questionsRef.push();
        await newQuestionRef.set({
          createdAt: admin.database.ServerValue.TIMESTAMP,
          ...createQuestionDto,
        });
        return { id: newQuestionRef.key, ...createQuestionDto };
      }
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    const [questionsSnapshot, examsSnapshot] = await Promise.all([
      this.questionsRef.once('value'),
      this.examsRef.once('value'),
    ]);

    const questions = questionsSnapshot.val() || {};
    const exams = examsSnapshot.val() || {};

    return Object.entries(questions).map(([id, data]: [string, any]) => ({
      id,
      ...data,
      examName: exams[data.examId]?.name || '',
    }));
  }

  async findAllExams() {
    const snapshot = await this.questionsRef.once('value');
    const questions = snapshot.val() || {};
    const exams = new Map();

    Object.entries(questions).forEach(([, data]: [string, any]) => {
      if (!exams.has(data.examId)) {
        exams.set(data.examId, {
          examId: data.examId,
          questionCount: 1,
        });
      } else {
        const exam = exams.get(data.examId);
        exam.questionCount++;
      }
    });

    return Array.from(exams.values());
  }

  async getQuestionBanks() {
    const snapshot = await this.questionsRef.once('value');
    const questions = snapshot.val() || {};
    const exams = new Map();

    Object.entries(questions).forEach(([, data]: [string, any]) => {
      const questionType = data.type;
      if (!exams.has(data.examId)) {
        exams.set(data.examId, {
          examId: data.examId,
          questionCount: 1,
          chapters: new Map(),
          questionTypes: this.initQuestionTypesCount(),
        });
        exams.get(data.examId).questionTypes[questionType]++;

        if (data.chapterNum && data.chapterName) {
          exams.get(data.examId).chapters.set(data.chapterNum, {
            chapterNum: data.chapterNum,
            chapterName: data.chapterName,
            questionCount: 1,
            questionTypes: this.initQuestionTypesCount(),
          });
          const examRef = exams.get(data.examId);
          const chapterRef = examRef.chapters.get(data.chapterNum);
          chapterRef.questionTypes[questionType]++;
        }
      } else {
        const exam = exams.get(data.examId);
        exam.questionCount++;
        exam.questionTypes[questionType]++;

        if (data.chapterNum && data.chapterName) {
          if (!exam.chapters.has(data.chapterNum)) {
            exam.chapters.set(data.chapterNum, {
              chapterNum: data.chapterNum,
              chapterName: data.chapterName,
              questionCount: 1,
              questionTypes: this.initQuestionTypesCount(),
            });
            const chapterRef = exam.chapters.get(data.chapterNum);
            chapterRef.questionTypes[questionType]++;
          } else {
            const chapter = exam.chapters.get(data.chapterNum);
            chapter.questionCount++;
            chapter.questionTypes[questionType]++;
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
      .orderByChild('examId')
      .equalTo(examId)
      .once('value');
    const questions = snapshot.val() || {};

    const chapters = new Map<string, Chapter>();
    const DEFAULT_CHAPTER = 'other';

    Object.entries(questions).forEach(([, data]: [string, any]) => {
      let targetChapterNum = DEFAULT_CHAPTER;
      let targetChapterName = '其他';

      if (data.chapterNum) {
        targetChapterNum = data.chapterNum;
        targetChapterName = data.chapterName || `第${data.chapterNum}章`;
      }

      if (!chapters.has(targetChapterNum)) {
        chapters.set(targetChapterNum, {
          chapterNum: targetChapterNum,
          chapterName: targetChapterName,
          questionCount: 1,
          questionTypes: this.initQuestionTypesCount(),
        });
        chapters.get(targetChapterNum).questionTypes[data.type]++;
      } else {
        const chapter = chapters.get(targetChapterNum);
        chapter.questionCount++;
        chapter.questionTypes[data.type]++;
      }
    });

    return Array.from(chapters.values()).sort((a, b) => {
      if (a.chapterNum === DEFAULT_CHAPTER) return 1;
      if (b.chapterNum === DEFAULT_CHAPTER) return -1;
      return a.chapterNum.localeCompare(b.chapterNum, undefined, {
        numeric: true,
      });
    });
  }

  private initQuestionTypesCount(): { [key: string]: number } {
    return {
      [QuestionType.SINGLE_CHOICE]: 0,
      [QuestionType.MULTIPLE_CHOICE]: 0,
      [QuestionType.TRUE_FALSE]: 0,
      [QuestionType.SHORT_ANSWER]: 0,
      [QuestionType.ESSAY]: 0,
    };
  }

  async findOne(id: string) {
    // 獲取所有考試
    const examsSnapshot = await this.examsRef.once('value');
    const exams = examsSnapshot.val() || {};

    // 遍歷所有考試尋找指定的題目
    for (const [, exam] of Object.entries(exams)) {
      const examData = exam as {
        questions?: {
          [key: string]: any;
        };
        id: string;
      };
      if (examData.questions && typeof examData.questions === 'object') {
        // 檢查是否在這個考試的題目中找到指定ID
        if (id in examData.questions) {
          const question = examData.questions[id];
          return {
            id,
            ...question,
            examId: examData.id,
          };
        }
      }
    }

    throw new NotFoundException('Question not found');
  }

  async update(id: string, updateData: Partial<CreateQuestionDto>) {
    try {
      // 找到題目所在的考試
      const examsSnapshot = await this.examsRef.once('value');
      const exams = examsSnapshot.val() || {};
      let examId: string | null = null;

      // 遍歷所有考試尋找指定的題目
      for (const [examKey, exam] of Object.entries(exams)) {
        const examData = exam as {
          questions?: {
            [key: string]: any;
          };
          id: string;
        };
        if (examData.questions && typeof examData.questions === 'object') {
          if (id in examData.questions) {
            examId = examKey;
            break;
          }
        }
      }

      if (!examId) {
        throw new NotFoundException('Question not found');
      }

      const updatedData = {
        ...updateData,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      };

      // 更新考試中的題目
      await this.examsRef
        .child(`${examId}/questions/${id}`)
        .update(updatedData);
      return this.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // 找到題目所在的考試
      const examsSnapshot = await this.examsRef.once('value');
      const exams = examsSnapshot.val() || {};
      let examId: string | null = null;

      // 遍歷所有考試尋找指定的題目
      for (const [examKey, exam] of Object.entries(exams)) {
        const examData = exam as {
          questions?: {
            [key: string]: any;
          };
          id: string;
        };
        if (examData.questions && typeof examData.questions === 'object') {
          if (id in examData.questions) {
            examId = examKey;
            break;
          }
        }
      }

      if (!examId) {
        throw new NotFoundException('Question not found');
      }

      // 從考試中刪除題目
      await this.examsRef.child(`${examId}/questions/${id}`).remove();
      return { message: 'Question deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async findByExam(examId: string) {
    const snapshot = await this.questionsRef
      .orderByChild('examId')
      .equalTo(examId)
      .once('value');
    const questions = snapshot.val() || {};
    return Object.entries(questions).map(([id, data]: [string, any]) => ({
      id,
      ...data,
    }));
  }

  async findByChapter(examId: string, chapterNum: string) {
    const snapshot = await this.questionsRef
      .orderByChild('examId')
      .equalTo(examId)
      .once('value');
    const questions = snapshot.val() || {};
    return Object.entries(questions)
      .filter(([, data]: [string, any]) => data.chapterNum === chapterNum)
      .map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }));
  }

  async findRandom(examIds?: string[], count: number = 1) {
    // 如果沒有提供考試ID，拋出錯誤
    if (!examIds || examIds.length === 0) {
      throw new NotFoundException('ExamIds are required');
    }

    // 獲取所有指定的考試
    const questionsFromAllExams = [];
    for (const examId of examIds) {
      const examSnapshot = await this.examsRef.child(examId).once('value');
      if (!examSnapshot.exists()) {
        continue; // 如果考試不存在就跳過
      }

      const examData = examSnapshot.val();
      if (examData.questions) {
        // 將每個題目加入陣列，並加上examId
        Object.entries(examData.questions).forEach(
          ([questionId, questionData]: [string, any]) => {
            questionsFromAllExams.push({
              id: questionId,
              examId,
              ...questionData,
            });
          },
        );
      }
    }

    // 如果沒有找到任何題目
    if (questionsFromAllExams.length === 0) {
      return [];
    }

    // 隨機排序並取得指定數量的題目
    const shuffled = questionsFromAllExams.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    // 移除答案後回傳
    return selected.map(
      ({ answer, ...questionWithoutAnswer }) => questionWithoutAnswer,
    );
  }

  async createQuestionForExam(
    examId: string,
    createQuestionDto: CreateQuestionDto,
  ) {
    // 確認考試是否存在
    const examSnapshot = await this.examsRef.child(examId).once('value');
    if (!examSnapshot.exists()) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // 準備題目資料
    const questionData = {
      content: createQuestionDto.content,
      type: createQuestionDto.type,
      options: createQuestionDto.options,
      answer: createQuestionDto.answer,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };

    // 在考試中新增題目
    const newQuestionRef = this.examsRef.child(`${examId}/questions`).push();
    await newQuestionRef.set(questionData);

    return {
      id: newQuestionRef.key,
      ...questionData,
      examId,
    };
  }

  async processExamResult(examResult: CreateExamResultDto) {
    const results = [];
    let correctCount = 0;

    // 處理每個答案
    for (const { questionId, answer } of examResult.answers) {
      // 找到題目
      let question;
      let examId;

      // 在所有考試中尋找題目
      const examsSnapshot = await this.examsRef.once('value');
      const exams = examsSnapshot.val() || {};

      examLoop: for (const [currentExamId, exam] of Object.entries(exams)) {
        const examData = exam as {
          questions?: { [key: string]: any };
          id: string;
        };
        if (examData.questions && typeof examData.questions === 'object') {
          if (questionId in examData.questions) {
            question = examData.questions[questionId];
            examId = currentExamId;
            break examLoop;
          }
        }
      }

      if (!question) {
        throw new NotFoundException(`Question with ID ${questionId} not found`);
      }

      // 確保答案是陣列
      const userAnswer = Array.isArray(answer) ? answer : [];
      const correctAnswer = Array.isArray(question.answer)
        ? question.answer
        : [];

      // 檢查答案是否正確
      const isCorrect =
        JSON.stringify([...userAnswer].sort()) ===
        JSON.stringify([...correctAnswer].sort());

      if (isCorrect) {
        correctCount++;
      }

      // 將結果加入陣列
      results.push({
        id: questionId,
        examId,
        content: question.content,
        type: question.type,
        options: question.options,
        correctAnswer: question.answer,
        userAnswer: answer,
        isCorrect,
      });
    }

    // 計算正確率
    const accuracy = results.length > 0 ? correctCount / results.length : 0;

    return {
      questions: results,
      summary: {
        totalQuestions: results.length,
        correctCount,
        accuracy,
        timeSpent: examResult.timeSpent,
      },
    };
  }
}
