import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../config/firebase.config';
import { CreateQuestionDto } from './dto/create-question.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class QuestionsService {
  private readonly questionsRef: admin.database.Reference;

  constructor(private readonly firebaseService: FirebaseService) {
    this.questionsRef = this.firebaseService.getDatabase().ref('questions');
  }

  async create(createQuestionDto: CreateQuestionDto) {
    try {
      const newQuestionRef = this.questionsRef.push();
      await newQuestionRef.set({
        ...createQuestionDto,
        createdAt: admin.database.ServerValue.TIMESTAMP,
      });
      return { id: newQuestionRef.key, ...createQuestionDto };
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    const snapshot = await this.questionsRef.once('value');
    return snapshot.val();
  }

  async findOne(id: string) {
    const snapshot = await this.questionsRef.child(id).once('value');
    if (!snapshot.exists()) {
      throw new NotFoundException('Question not found');
    }
    return snapshot.val();
  }

  async update(id: string, updateData: Partial<CreateQuestionDto>) {
    try {
      await this.questionsRef.child(id).update({
        ...updateData,
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

  async findByCategory(category: string) {
    const snapshot = await this.questionsRef
      .orderByChild('category')
      .equalTo(category)
      .once('value');
    return snapshot.val();
  }

  async findRandom(category?: string, limit: number = 1) {
    let snapshot: admin.database.DataSnapshot;
    if (category) {
      snapshot = await this.questionsRef
        .orderByChild('category')
        .equalTo(category)
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
        ...(data as object),
      }),
    );
    const shuffled = questionArray.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }
}
