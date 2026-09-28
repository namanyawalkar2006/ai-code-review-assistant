import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, UploadFilesDto } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    if (!userId) throw new BadRequestException('User context is required');
    return this.prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { files: true, reviews: true, chatSessions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(projectId: string, userId: string) {
    if (!projectId) throw new BadRequestException('Project ID is required');

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        files: {
          select: { id: true, path: true, size: true, createdAt: true },
          orderBy: { path: 'asc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access to this project workspace is denied');
    }

    return project;
  }

  async create(userId: string, dto: CreateProjectDto) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Project name cannot be empty');
    }

    return this.prisma.project.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description?.trim() || '',
      },
    });
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.get(projectId, userId);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      },
    });
  }

  async delete(projectId: string, userId: string) {
    await this.get(projectId, userId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true, message: 'Project workspace and associated artifacts deleted' };
  }

  async uploadFiles(projectId: string, userId: string, dto: UploadFilesDto) {
    await this.get(projectId, userId);

    if (!dto.files || dto.files.length === 0) {
      throw new BadRequestException('At least one file payload must be provided for upload');
    }

    // Sanitize and validate paths
    for (const f of dto.files) {
      if (!f.path || !f.path.trim()) {
        throw new BadRequestException('Invalid file entry: path cannot be empty');
      }
      if (f.path.includes('..') || f.path.startsWith('/')) {
        throw new BadRequestException(`Unsafe relative path detected: ${f.path}`);
      }
    }

    const ops = dto.files.map((f) =>
      this.prisma.file.upsert({
        where: {
          projectId_path: {
            projectId,
            path: f.path.trim(),
          },
        },
        update: {
          content: f.content || '',
          size: f.size ?? Buffer.byteLength(f.content || '', 'utf8'),
        },
        create: {
          projectId,
          path: f.path.trim(),
          content: f.content || '',
          size: f.size ?? Buffer.byteLength(f.content || '', 'utf8'),
        },
      }),
    );

    const savedFiles = await this.prisma.$transaction(ops);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      count: savedFiles.length,
      files: savedFiles.map((sf) => ({ id: sf.id, path: sf.path, size: sf.size })),
    };
  }

  async getFileContent(projectId: string, fileId: string, userId: string) {
    await this.get(projectId, userId);
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, projectId },
    });
    if (!file) throw new NotFoundException('File not found in project');
    return file;
  }
}
