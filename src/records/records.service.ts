import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../config/firebase.config';
import { CreateRecordDto } from './dto/create-record.dto';
import * as admin from 'firebase-admin';
@Injectable()
export class RecordsService {
  private readonly recordsRef: admin.database.Reference;
  constructor(private readonly firebaseService: FirebaseService) {
    this.recordsRef = this.firebaseService.getDatabase().ref('records');
  }
  async create(createRecordDto: CreateRecordDto) {
    try {
      const newRecordRef = this.recordsRef.push();
      await newRecordRef.set({
        ...createRecordDto,
        createdAt: admin.database.ServerValue.TIMESTAMP,
      });
      return { id: newRecordRef.key, ...createRecordDto };
    } catch (error) {
      throw error;
    }
  }
  async findAll() {
    const snapshot = await this.recordsRef.once('value');
    return snapshot.val();
  }
  async findOne(id: string) {
    const snapshot = await this.recordsRef.child(id).once('value');
    if (!snapshot.exists()) {
      throw new NotFoundException('Record not found');
    }
    return snapshot.val();
  }
  async findByUser(userId: string) {
    const snapshot = await this.recordsRef
      .orderByChild('userId')
      .equalTo(userId)
      .once('value');
    return snapshot.val();
  }
  async update(id: string, updateData: Partial<CreateRecordDto>) {
    try {
      await this.recordsRef.child(id).update({
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
      await this.recordsRef.child(id).remove();
      return { message: 'Record deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
  async getStatsByUser(userId: string) {
    const snapshot = await this.recordsRef
      .orderByChild('userId')
      .equalTo(userId)
      .once('value');
    const records = snapshot.val() || {};
    return {
      totalAnswered: Object.keys(records).length,
      correctCount: Object.values(records).filter(
        (record: any) => record.isCorrect,
      ).length,
      averageTimeSpent: Object.keys(records).length
        ? Number(
            Object.values(records).reduce(
              (acc: number, record: any) => acc + (record.timeSpent || 0),
              0,
            ),
          ) / Object.keys(records).length
        : 0,
      byCategory: Object.values(records).reduce((acc: any, record: any) => {
        const category = record.category;
        if (!acc[category]) {
          acc[category] = { total: 0, correct: 0 };
        }
        acc[category].total++;
        if (record.isCorrect) {
          acc[category].correct++;
        }
        return acc;
      }, {}),
    };
  }
}
