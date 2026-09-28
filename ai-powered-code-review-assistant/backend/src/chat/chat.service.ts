import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { DynamicAIClient } from '../ai-provider/dynamic-ai.client';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class ChatService {
  private dynamicClient: DynamicAIClient;

  constructor(
    private prisma: PrismaService,
    private aiProviderService: AIProviderService,
  ) {
    this.dynamicClient = new DynamicAIClient();
  }

  async createSession(userId: string, dto: CreateSessionDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Forbidden');

    return this.prisma.chatSession.create({
      data: {
        projectId: dto.projectId,
        title: dto.title || `Chat - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      },
    });
  }

  async getSessions(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.userId !== userId) throw new ForbiddenException('Forbidden');

    return this.prisma.chatSession.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });
  }

  async getMessages(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { project: true },
    });
    if (!session || session.project.userId !== userId) throw new ForbiddenException('Forbidden');

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, sessionId: string, dto: SendMessageDto) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        project: {
          include: { files: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    });

    if (!session || session.project.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    // Persist User Message
    const userMsg = await this.prisma.message.create({
      data: {
        sessionId,
        sender: 'USER',
        text: dto.message,
      },
    });

    // Build context from files
    const relevantFiles = dto.relevantFilePaths && dto.relevantFilePaths.length > 0
      ? session.project.files.filter((f) => dto.relevantFilePaths!.includes(f.path))
      : session.project.files.slice(0, 15); // Context limit guard

    const filesContext = relevantFiles
      .map((f) => `### FILE: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join('\n\n');

    const systemPrompt = `You are an elite Senior Staff Engineer and AI Code Review Assistant.
You have full access to the user's project codebase below:
${filesContext}

Instructions:
1. Answer the developer's question directly with high technical precision.
2. Ground your answers specifically in the provided codebase files, citing exact files, classes, and lines.
3. Suggest concrete, production-ready code examples when recommending improvements or fixes.
4. Keep explanations concise, professional, and actionable.`;

    let replyText = '';
    const activeProvider = await this.aiProviderService.getActiveProviderForUser(userId);

    if (activeProvider && activeProvider.baseUrl && !activeProvider.baseUrl.includes('googleapis.com')) {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...session.messages.map((m) => ({
          role: (m.sender === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text,
        })),
        { role: 'user' as const, content: dto.message },
      ];

      replyText = await this.dynamicClient.executeChatCompletion({
        baseUrl: activeProvider.baseUrl,
        apiKey: activeProvider.apiKeyEncrypted || undefined,
        modelName: activeProvider.modelName,
        messages,
        temperature: 0.2,
      });
    } else {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const conversationHistory = session.messages.map((m) => ({
        role: m.sender === 'USER' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const contents = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: dto.message }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });

      replyText = response.text || 'Unable to generate response from model.';
    }

    // Persist Assistant Message
    const assistantMsg = await this.prisma.message.create({
      data: {
        sessionId,
        sender: 'ASSISTANT',
        text: replyText,
      },
    });

    return {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    };
  }
}
