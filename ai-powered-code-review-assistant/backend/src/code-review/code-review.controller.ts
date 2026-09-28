import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CodeReviewService } from './code-review.service';
import { RequestReviewDto, ReviewModeEnum } from './dto/code-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class CodeReviewController {
  constructor(private codeReviewService: CodeReviewService) {}

  @Post('run')
  async runReview(@Request() req: any, @Body() dto: RequestReviewDto) {
    return this.codeReviewService.runReview(req.user.id, dto);
  }

  @Get('history')
  async getHistory(
    @Request() req: any,
    @Query('projectId') projectId?: string,
    @Query('mode') mode?: ReviewModeEnum,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.codeReviewService.getReviewHistory(
      req.user.id,
      projectId,
      mode,
      search,
      pageNum,
      limitNum,
    );
  }

  @Get(':id')
  async getById(@Request() req: any, @Param('id') id: string) {
    return this.codeReviewService.getReviewById(req.user.id, id);
  }
}
