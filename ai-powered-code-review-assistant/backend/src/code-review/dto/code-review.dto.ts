import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReviewModeEnum {
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  CODE_QUALITY = 'CODE_QUALITY',
}

export enum ReviewScopeEnum {
  SINGLE_FILE = 'SINGLE_FILE',
  SELECTED_FILES = 'SELECTED_FILES',
  FULL_PROJECT = 'FULL_PROJECT',
}

export class RequestReviewDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsEnum(ReviewModeEnum)
  mode: ReviewModeEnum;

  @IsEnum(ReviewScopeEnum)
  scope: ReviewScopeEnum;

  @IsArray()
  @IsOptional()
  fileIds?: string[];
}

export interface ReviewIssue {
  file: string;
  line: number;
  rule: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  suggestedFix: string;
}

export interface ReviewResultPayload {
  summary: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  issues: ReviewIssue[];
  recommendations: string[];
}
