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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, UploadFilesDto } from './dto/projects.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async list(@Request() req: any) {
    return this.projectsService.list(req.user.id);
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, dto);
  }

  @Get(':id')
  async get(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.get(id, req.user.id);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.delete(id, req.user.id);
  }

  @Post(':id/files')
  async uploadFiles(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UploadFilesDto,
  ) {
    return this.projectsService.uploadFiles(id, req.user.id, dto);
  }

  @Get(':id/files/:fileId')
  async getFile(
    @Request() req: any,
    @Param('id') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projectsService.getFileContent(projectId, fileId, req.user.id);
  }
}
