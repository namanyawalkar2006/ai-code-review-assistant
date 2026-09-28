import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class ConfigureProviderDto {
  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsNotEmpty()
  modelName: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class TestProviderDto {
  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsNotEmpty()
  modelName: string;
}
