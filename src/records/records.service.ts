import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
      console.log('Creating record with data:', createRecordDto);

      if (!createRecordDto.userId) {
        throw new BadRequestException('userId is required');
      }

      const recordData = {
        ...createRecordDto,
        createdAt: admin.database.ServerValue.TIMESTAMP,
      };

      console.log('Final record data:', recordData);

      const newRecordRef = this.recordsRef.push();
      await newRecordRef.set(recordData);

      return { id: newRecordRef.key, ...recordData };
    } catch (error) {
      console.error('Error creating record:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to create record: ' + error.message,
      );
    }
  }

  async findAll() {
    try {
      const snapshot = await this.recordsRef.once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error finding all records:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const snapshot = await this.recordsRef.child(id).once('value');
      if (!snapshot.exists()) {
        throw new NotFoundException('Record not found');
      }
      return snapshot.val();
    } catch (error) {
      console.error('Error finding record:', error);
      throw error;
    }
  }

  async findByUser(userId: string) {
    try {
      const snapshot = await this.recordsRef
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error finding records by user:', error);
      throw error;
    }
  }

  async update(id: string, updateData: Partial<CreateRecordDto>) {
    try {
      const updatePayload = {
        ...updateData,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      };
      await this.recordsRef.child(id).update(updatePayload);
      return this.findOne(id);
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.recordsRef.child(id).remove();
      return { message: 'Record deleted successfully' };
    } catch (error) {
      console.error('Error removing record:', error);
      throw error;
    }
  }

  async getStatsByUser(userId: string) {
    try {
      const snapshot = await this.recordsRef
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
      const records = snapshot.val() || {};

      const stats = {
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

      console.log('Generated stats for user:', userId, stats);
      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}
