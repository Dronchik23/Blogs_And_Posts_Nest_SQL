// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import { AttemptsRepository } from '../../attempts/attempts.repository';
//
// @Injectable()
// export class AttemptsControlGuard implements NestMiddleware {
//   constructor(private readonly attemptsRepository: AttemptsRepository) {}
//
//   async use(req: Request, res: Response, next: NextFunction) {
//     const ip = req.ip;
//     const url = req.url;
//     const currentTime = new Date().toISOString();
//     await this.attemptsRepository.addAttempt(ip, url, currentTime);
//     const attemptsTime = new Date(
//       +new Date(currentTime) - 10 * 1000,
//     ).toISOString();
//     const attemptsCount = await this.attemptsRepository.getLastAttempts(
//       ip,
//       url,
//       attemptsTime,
//     );
//     console.log(attemptsCount);
//     if (attemptsCount > 5) {
//       return res.sendStatus(429);
//     }
//     next();
//   }
// }
