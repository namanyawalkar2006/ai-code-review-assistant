import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UploadFileItemDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  content: string;

  @IsOptional()
  size?: number;
}

export class UploadFilesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadFileItemDto)
  files: UploadFileItemDto[];
}
