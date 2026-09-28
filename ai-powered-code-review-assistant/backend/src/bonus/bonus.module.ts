import { Module } from '@nestjs/common';
import { BonusService } from './bonus.service';
import { BonusController } from './bonus.controller';
import { AIProviderModule } from '../ai-provider/ai-provider.module';

@Module({
  imports: [AIProviderModule],
  providers: [BonusService],
  controllers: [BonusController],
  exports: [BonusService],
})
export class BonusModule {}
