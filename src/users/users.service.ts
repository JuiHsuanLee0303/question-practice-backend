import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../config/firebase.config';
import { CreateUserDto } from './dto/create-user.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  private readonly usersRef: admin.database.Reference;

  constructor(private readonly firebaseService: FirebaseService) {
    this.usersRef = this.firebaseService.getDatabase().ref('users');
  }

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    try {
      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email: createUserDto.email,
        password: password,
        displayName: createUserDto.username,
      });

      // Ensure role is set
      const userDataWithRole = {
        ...userData,
        role: userData.role || 'user',
        createdAt: admin.database.ServerValue.TIMESTAMP,
      };

      // Store additional user data in Realtime Database
      await this.usersRef.child(userRecord.uid).set(userDataWithRole);

      return { uid: userRecord.uid, ...userDataWithRole };
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async findAll() {
    const snapshot = await this.usersRef.once('value');
    return snapshot.val();
  }

  async findOne(uid: string) {
    const snapshot = await this.usersRef.child(uid).once('value');
    if (!snapshot.exists()) {
      throw new NotFoundException('User not found');
    }
    return snapshot.val();
  }

  async update(uid: string, updateData: Partial<CreateUserDto>) {
    const { password, ...userData } = updateData;
    try {
      if (password) {
        await admin.auth().updateUser(uid, { password });
      }
      await this.usersRef.child(uid).update({
        ...userData,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      });
      return this.findOne(uid);
    } catch (error) {
      throw error;
    }
  }

  async remove(uid: string) {
    try {
      await admin.auth().deleteUser(uid);
      await this.usersRef.child(uid).remove();
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}
