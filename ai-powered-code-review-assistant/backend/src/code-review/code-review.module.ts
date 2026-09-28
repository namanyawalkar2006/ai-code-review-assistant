import { Module } from '@nestjs/common';
import { CodeReviewService } from './code-review.service';
import { CodeReviewController } from './code-review.controller';
import { AIProviderModule } from '../ai-provider/ai-provider.module';

@Module({
  imports: [AIProviderModule],
  providers: [CodeReviewService],
  controllers: [CodeReviewController],
  exports: [CodeReviewService],
})
export class CodeReviewModule {}
