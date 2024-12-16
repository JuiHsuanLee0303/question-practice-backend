import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string): Promise<any> {
    try {
      const userCredential = await admin.auth().getUserByEmail(email);
      console.log('User credential:', userCredential);
      return this.usersService.findOne(userCredential.uid);
    } catch (error) {
      console.error('Validate user error:', error);
      throw new UnauthorizedException();
    }
  }

  async login(loginDto: LoginDto) {
    try {
      console.log('Login attempt for email:', loginDto.email);

      if (!loginDto.email || !loginDto.email.includes('@')) {
        throw new BadRequestException('Invalid email format');
      }

      // 使用 Firebase Admin SDK 驗證用戶
      const userRecord = await admin.auth().getUserByEmail(loginDto.email);
      console.log('User record from Firebase:', userRecord);

      // 獲取用戶數據
      const user = await this.usersService.findOne(userRecord.uid);
      console.log('User data from database:', user);

      if (!user) {
        throw new UnauthorizedException('User not found in database');
      }

      // 創建 JWT payload
      const payload = {
        email: loginDto.email,
        sub: userRecord.uid,
        role: user.role || 'user',
      };
      console.log('Created JWT payload:', payload);

      // 返回 JWT token 和用戶信息
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          uid: userRecord.uid,
          email: loginDto.email,
          username: user.username,
          role: user.role || 'user',
        },
      };
    } catch (error) {
      console.error('Login error details:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.code === 'auth/invalid-email') {
        throw new BadRequestException('Invalid email format');
      }

      if (error.code === 'auth/user-not-found') {
        throw new UnauthorizedException('User not found');
      }

      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
