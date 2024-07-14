import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import { FirebaseConfig } from '../config/config.interface.js';

@Injectable()
export class FirebaseService {
  public readonly app?: admin.app.App;

  public constructor(config: ConfigService) {
    const firebaseConfig = config.get<FirebaseConfig>('firebase');
    if (firebaseConfig) {
      const serviceAccount = JSON.parse(
        Buffer.from(firebaseConfig.serviceAccount, 'base64').toString('utf-8'),
      );

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
}
