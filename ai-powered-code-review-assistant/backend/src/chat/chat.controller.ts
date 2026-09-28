import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('sessions')
  async createSession(@Request() req: any, @Body() dto: CreateSessionDto) {
    return this.chatService.createSession(req.user.id, dto);
  }

  @Get('sessions/:projectId')
  async getSessions(@Request() req: any, @Param('projectId') projectId: string) {
    return this.chatService.getSessions(req.user.id, projectId);
  }

  @Get('sessions/:sessionId/messages')
  async getMessages(@Request() req: any, @Param('sessionId') sessionId: string) {
    return this.chatService.getMessages(req.user.id, sessionId);
  }

  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, sessionId, dto);
  }
}
