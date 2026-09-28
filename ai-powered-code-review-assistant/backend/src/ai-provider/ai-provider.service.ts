import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigureProviderDto, TestProviderDto } from './dto/ai-provider.dto';
import { DynamicAIClient } from './dynamic-ai.client';

@Injectable()
export class AIProviderService {
  private dynamicClient: DynamicAIClient;

  constructor(private prisma: PrismaService) {
    this.dynamicClient = new DynamicAIClient();
  }

  async list(userId: string) {
    return this.prisma.aIProvider.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        baseUrl: true,
        modelName: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        // Omit apiKeyEncrypted from general response
      },
    });
  }

  async configure(userId: string, dto: ConfigureProviderDto) {
    if (dto.isDefault) {
      await this.prisma.aIProvider.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.aIProvider.create({
      data: {
        userId,
        baseUrl: dto.baseUrl,
        apiKeyEncrypted: dto.apiKey || null,
        modelName: dto.modelName,
        isDefault: dto.isDefault ?? true,
      },
    });
  }

  async setDefault(userId: string, providerId: string) {
    const provider = await this.prisma.aIProvider.findFirst({
      where: { id: providerId, userId },
    });
    if (!provider) throw new NotFoundException('AI Provider configuration not found');

    await this.prisma.aIProvider.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return this.prisma.aIProvider.update({
      where: { id: providerId },
      data: { isDefault: true },
    });
  }

  async delete(userId: string, providerId: string) {
    const provider = await this.prisma.aIProvider.findFirst({
      where: { id: providerId, userId },
    });
    if (!provider) throw new NotFoundException('AI Provider configuration not found');

    await this.prisma.aIProvider.delete({ where: { id: providerId } });
    return { success: true, message: 'Provider deleted' };
  }

  async testConnection(dto: TestProviderDto) {
    return this.dynamicClient.testConnection(dto.baseUrl, dto.apiKey, dto.modelName);
  }

  async getActiveProviderForUser(userId: string) {
    let provider = await this.prisma.aIProvider.findFirst({
      where: { userId, isDefault: true },
    });

    if (!provider) {
      provider = await this.prisma.aIProvider.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return provider;
  }
}
