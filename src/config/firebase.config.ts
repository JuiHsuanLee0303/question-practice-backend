import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as serviceAccount from './serviceAccount.json';

@Injectable()
export class FirebaseService {
  private readonly database: admin.database.Database;

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
        databaseURL:
          'https://question-practice-default-rtdb.asia-southeast1.firebasedatabase.app',
      });
    }
    this.database = admin.database();
  }

  getDatabase() {
    return this.database;
  }
}
