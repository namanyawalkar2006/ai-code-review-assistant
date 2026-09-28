import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { AIProviderModule } from './ai-provider/ai-provider.module';
import { CodeReviewModule } from './code-review/code-review.module';
import { ChatModule } from './chat/chat.module';
import { BonusModule } from './bonus/bonus.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    AIProviderModule,
    CodeReviewModule,
    ChatModule,
    BonusModule,
  ],
})
export class AppModule {}
