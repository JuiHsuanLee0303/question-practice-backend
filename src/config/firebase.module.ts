import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.config';

@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
