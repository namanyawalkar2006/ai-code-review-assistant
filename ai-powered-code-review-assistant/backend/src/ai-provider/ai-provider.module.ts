import { Module } from '@nestjs/common';
import { AIProviderService } from './ai-provider.service';
import { AIProviderController } from './ai-provider.controller';

@Module({
  providers: [AIProviderService],
  controllers: [AIProviderController],
  exports: [AIProviderService],
})
export class AIProviderModule {}
