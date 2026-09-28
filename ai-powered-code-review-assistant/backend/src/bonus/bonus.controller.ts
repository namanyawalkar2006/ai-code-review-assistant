import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BonusService, GenerateDocsDto, GenerateTestsDto } from './bonus.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bonus')
export class BonusController {
  constructor(private bonusService: BonusService) {}

  @Post('generate-docs')
  async generateDocs(@Request() req: any, @Body() dto: GenerateDocsDto) {
    return this.bonusService.generateDocs(req.user.id, dto);
  }

  @Post('generate-tests')
  async generateTests(@Request() req: any, @Body() dto: GenerateTestsDto) {
    return this.bonusService.generateTests(req.user.id, dto);
  }
}
