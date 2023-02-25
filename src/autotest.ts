// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
//
// @Injectable()
// export class DatabaseService {
//   constructor(
//     @InjectModel(Blog.name) private readonly blogModel: Model<Blog>,
//     @InjectModel(Post.name) private readonly postModel: Model<Post>,
//   ) {}
//
//   async removeAll(): Promise<void> {
//     await this.blogModel.deleteMany({});
//     await this.postModel.deleteMany({});
//   }
// }
