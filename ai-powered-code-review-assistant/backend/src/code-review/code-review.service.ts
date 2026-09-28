import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { DynamicAIClient } from '../ai-provider/dynamic-ai.client';
import {
  RequestReviewDto,
  ReviewModeEnum,
  ReviewScopeEnum,
  ReviewResultPayload,
} from './dto/code-review.dto';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class CodeReviewService {
  private dynamicClient: DynamicAIClient;

  constructor(
    private prisma: PrismaService,
    private aiProviderService: AIProviderService,
  ) {
    this.dynamicClient = new DynamicAIClient();
  }

  private resolveReviewPromptTemplate(mode: ReviewModeEnum): string {
    switch (mode) {
      case ReviewModeEnum.SECURITY:
        return `You are a Principal Application Security Architect and Lead DevSecOps Auditor.
Perform an exhaustive SECURITY REVIEW on the submitted codebase.
Detect:
1. OWASP Top 10 vulnerabilities (SQL/NoSQL/Command injection, SSRF, Broken Access Control, IDOR).
2. Hardcoded secrets, API tokens, unhashed credentials, insecure cryptography or random generators.
3. Authentication and authorization bypasses, JWT misconfigurations, CORS/CSRF vulnerabilities.
4. Input validation and sanitization oversights.
5. Insecure dependencies and deserialization vectors.`;

      case ReviewModeEnum.PERFORMANCE:
        return `You are a Principal Performance Engineer and High-Scale Systems Architect.
Perform an exhaustive PERFORMANCE REVIEW on the submitted codebase.
Detect:
1. Inefficient algorithmic complexity (O(N^2) loops, nested iterations).
2. Database bottlenecks (N+1 query problems, missing indexes, unpaginated scans, connection leakages).
3. Memory leaks, unbounded cache growth, dangling listeners or event subscriptions.
4. Blocking I/O or synchronous operations in asynchronous event loops.
5. Frontend rendering bottlenecks (unmemoized re-renders, large bundle imports, layout thrashing).`;

      case ReviewModeEnum.CODE_QUALITY:
      default:
        return `You are a Staff Software Architect and Clean Code Evangelist.
Perform an exhaustive CODE QUALITY REVIEW on the submitted codebase.
Detect:
1. Architectural violations (separation of concerns, SOLID principles, spaghetti code, god classes).
2. Code maintainability, cyclomatic complexity, code duplication (DRY violations).
3. Type safety gaps, implicit 'any', unsafe casts, unhandled promise rejections.
4. Inconsistent naming conventions, lack of readability, dead code or commented-out code.
5. Error handling resilience and edge-case boundaries.`;
    }
  }

  calculateSeverityScore(issues: Array<{ severity: string }>): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (!issues || issues.length === 0) return 'LOW';
    if (issues.some((i) => i.severity?.toUpperCase() === 'CRITICAL')) return 'CRITICAL';
    if (issues.some((i) => i.severity?.toUpperCase() === 'HIGH')) return 'HIGH';
    if (issues.some((i) => i.severity?.toUpperCase() === 'MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  async runReview(userId: string, dto: RequestReviewDto): Promise<any> {
    if (!dto.projectId) {
      throw new BadRequestException('Project ID must be specified');
    }

    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, userId },
      include: { files: true },
    });

    if (!project) throw new NotFoundException('Target project not found');

    let targetFiles = project.files;
    if (dto.scope === ReviewScopeEnum.SINGLE_FILE || dto.scope === ReviewScopeEnum.SELECTED_FILES) {
      if (!dto.fileIds || dto.fileIds.length === 0) {
        throw new BadRequestException('fileIds required for selected review scope');
      }
      targetFiles = project.files.filter((f) => dto.fileIds.includes(f.id));
    }

    if (targetFiles.length === 0) {
      throw new BadRequestException('No files found to review in the selected scope');
    }

    const codePayload = targetFiles
      .map((f) => `### FILE: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join('\n\n');

    const systemPrompt = `${this.resolveReviewPromptTemplate(dto.mode)}

CRITICAL OUTPUT FORMAT:
You MUST respond with a single valid, well-formed JSON object ONLY (no markdown surrounding ticks, no commentary before or after).
The JSON schema MUST match:
{
  "summary": "Executive overview of findings and architectural health score (3-5 sentences)",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "issues": [
    {
      "file": "relative/file/path.ext",
      "line": 42,
      "rule": "Specific rule name e.g. SEC-001-HARDCODED-SECRET",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "message": "Precise description of the vulnerability or defect",
      "suggestedFix": "Code diff snippet or concrete replacement code"
    }
  ],
  "recommendations": [
    "Strategic recommendation 1",
    "Strategic recommendation 2"
  ]
}`;

    let parsedResult: ReviewResultPayload;
    const activeProvider = await this.aiProviderService.getActiveProviderForUser(userId);

    if (activeProvider && activeProvider.baseUrl && !activeProvider.baseUrl.includes('googleapis.com')) {
      const rawOutput = await this.dynamicClient.executeChatCompletion({
        baseUrl: activeProvider.baseUrl,
        apiKey: activeProvider.apiKeyEncrypted || undefined,
        modelName: activeProvider.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Review the following project code:\n\n${codePayload}` },
        ],
        temperature: 0.1,
        responseFormatJson: true,
      });

      parsedResult = this.parseReviewResponse(rawOutput);
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
            parts: [
              {
                text: `${systemPrompt}\n\nReview the following project code:\n\n${codePayload}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      parsedResult = this.parseReviewResponse(response.text || '{}');
    }

    const calculatedSeverity = this.calculateSeverityScore(parsedResult.issues);

    const reviewRecord = await this.prisma.review.create({
      data: {
        projectId: project.id,
        mode: dto.mode as any,
        summary: parsedResult.summary || 'Review completed successfully.',
        severity: calculatedSeverity as any,
        issuesJson: parsedResult.issues || [],
        recommendationsJson: parsedResult.recommendations || [],
      },
    });

    return reviewRecord;
  }

  async getReviewHistory(
    userId: string,
    projectId?: string,
    mode?: ReviewModeEnum,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const pageNumber = Math.max(1, page);
    const pageSize = Math.min(50, Math.max(1, limit));
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {
      project: { userId },
    };

    if (projectId) where.projectId = projectId;
    if (mode) where.mode = mode;
    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { summary: { contains: query, mode: 'insensitive' } },
        { project: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getReviewById(userId: string, reviewId: string) {
    if (!reviewId) throw new BadRequestException('Review ID must be provided');

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: {
          select: { id: true, name: true, userId: true },
        },
      },
    });

    if (!review || review.project.userId !== userId) {
      throw new NotFoundException('Review not found or unauthorized');
    }

    return review;
  }

  private parseReviewResponse(text: string): ReviewResultPayload {
    try {
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const obj = JSON.parse(cleaned);
      return {
        summary: obj.summary || 'Code analysis completed.',
        severity: obj.severity || 'Medium',
        issues: Array.isArray(obj.issues) ? obj.issues : [],
        recommendations: Array.isArray(obj.recommendations) ? obj.recommendations : [],
      };
    } catch {
      return {
        summary: 'Code review completed with structural fallback formatting.',
        severity: 'Medium',
        issues: [],
        recommendations: ['Review output parsing warning; re-run review for detailed breakdown.'],
      };
    }
  }
}
