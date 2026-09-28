import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AIProviderService } from './ai-provider.service';
import { ConfigureProviderDto, TestProviderDto } from './dto/ai-provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai-providers')
export class AIProviderController {
  constructor(private aiProviderService: AIProviderService) {}

  @Get()
  async list(@Request() req: any) {
    return this.aiProviderService.list(req.user.id);
  }

  @Post()
  async configure(@Request() req: any, @Body() dto: ConfigureProviderDto) {
    return this.aiProviderService.configure(req.user.id, dto);
  }

  @Put(':id/default')
  async setDefault(@Request() req: any, @Param('id') id: string) {
    return this.aiProviderService.setDefault(req.user.id, id);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.aiProviderService.delete(req.user.id, id);
  }

  @Post('test')
  async test(@Body() dto: TestProviderDto) {
    return this.aiProviderService.testConnection(dto);
  }
}
