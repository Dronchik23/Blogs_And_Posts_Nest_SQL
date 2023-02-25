import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attempt, AttemptDocument } from '../types and models/schemas';

@Injectable()
export class AttemptsRepository {
  constructor(
    @InjectModel(Attempt.name) private attemptModel: Model<AttemptDocument>,
  ) {}

  async addAttempt(ip: string, url: string, time: string) {
    return this.attemptModel.create({
      ip,
      url,
      attemptsTime: time,
    });
  }

  async removeOldAttempts() {
    const result = await this.attemptModel.deleteMany({});
    return result.deletedCount;
  }

  async getLastAttempts(ip: string, url: string, attemptsTime: string) {
    return this.attemptModel.countDocuments({
      ip,
      url,
      attemptsTime: { $gt: attemptsTime },
    });
  }

  async deleteAllAttempts(): Promise<any> {
    return this.attemptModel.deleteMany({});
  }
}
