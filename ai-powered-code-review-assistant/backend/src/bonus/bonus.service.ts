import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { DynamicAIClient } from '../ai-provider/dynamic-ai.client';
import { GoogleGenAI } from '@google/genai';

export interface GenerateDocsDto {
  projectId: string;
  fileIds?: string[];
  docType: 'README' | 'API_SPEC' | 'ARCHITECTURE_OVERVIEW';
}

export interface GenerateTestsDto {
  projectId: string;
  fileId: string;
  framework: 'jest' | 'vitest' | 'playwright';
  testType: 'unit' | 'integration' | 'edge_cases';
}

@Injectable()
export class BonusService {
  private dynamicClient: DynamicAIClient;

  constructor(
    private prisma: PrismaService,
    private aiProviderService: AIProviderService,
  ) {
    this.dynamicClient = new DynamicAIClient();
  }

  async generateDocs(userId: string, dto: GenerateDocsDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, userId },
      include: { files: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const filesToDoc = dto.fileIds && dto.fileIds.length > 0
      ? project.files.filter((f) => dto.fileIds!.includes(f.id))
      : project.files;

    if (filesToDoc.length === 0) throw new BadRequestException('No files to document');

    const codeContext = filesToDoc
      .map((f) => `### FILE: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join('\n\n');

    const systemPrompt = `You are a Principal Technical Writer and Staff Systems Architect.
Generate professional, publication-ready documentation of type: ${dto.docType}.
Format output as clean, beautifully structured Markdown. Include:
1. Executive Summary & Architecture Overview
2. Module / API Endpoints Breakdown with request/response signatures where applicable
3. Installation, Environment Variables, and Setup Steps
4. Key Design Decisions and Security Considerations`;

    return this.invokeAi(userId, systemPrompt, `Generate ${dto.docType} for this codebase:\n\n${codeContext}`);
  }

  async generateTests(userId: string, dto: GenerateTestsDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const file = await this.prisma.file.findFirst({
      where: { id: dto.fileId, projectId: dto.projectId },
    });
    if (!file) throw new NotFoundException('Target file not found');

    const systemPrompt = `You are a Principal Software Test Engineer and Quality Assurance Architect.
Generate a comprehensive, production-grade test suite using framework: ${dto.framework}.
Focus on: ${dto.testType} testing.
Requirements:
1. Write 100% executable TypeScript / JavaScript test code.
2. Include comprehensive test cases: happy path, boundary values, error scenarios, invalid inputs, and security edge cases.
3. Include proper mocks, spies, and setup/teardown (beforeEach/afterEach).
4. Provide meaningful test descriptions explaining what invariant is being validated.`;

    return this.invokeAi(
      userId,
      systemPrompt,
      `Target File Path: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\nGenerate ${dto.testType} tests for this file.`,
    );
  }

  private async invokeAi(userId: string, systemPrompt: string, userPrompt: string): Promise<{ result: string }> {
    const activeProvider = await this.aiProviderService.getActiveProviderForUser(userId);

    if (activeProvider && activeProvider.baseUrl && !activeProvider.baseUrl.includes('googleapis.com')) {
      const output = await this.dynamicClient.executeChatCompletion({
        baseUrl: activeProvider.baseUrl,
        apiKey: activeProvider.apiKeyEncrypted || undefined,
        modelName: activeProvider.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      });
      return { result: output };
    } else {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        config: {
          temperature: 0.2,
        },
      });

      return { result: response.text || 'Unable to generate documentation.' };
    }
  }
}
