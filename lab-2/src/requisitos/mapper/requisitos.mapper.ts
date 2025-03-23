import { RepositoryEntity } from '../../entities/repository.entity';
import { Requisito1ResponseDto, Requisito3ResponseDto } from '../dto/requisitos-response.dto';

export const requisito1Mapper = (
  repository: RepositoryEntity,
): Requisito1ResponseDto => ({
  name: repository.name,
  owner: repository.owner,
  primaryLanguage: repository.primaryLanguage,
  createdAt: repository.createdAt,
  updatedAt: repository.updatedAt,
  url: repository.url,
  popularity: repository.stargazerCount,
  cbo: repository.metricsCk.cbo,
  dit: repository.metricsCk.dit,
  lcom: repository.metricsCk.lcom,
  loc: repository.metricsCk.loc,
  compositeScore : repository.compositeScore
});

export const requisito2Mapper = (
  repository: RepositoryEntity,
): Requisito1ResponseDto => ({
  name: repository.name,
  owner: repository.owner,
  primaryLanguage: repository.primaryLanguage,
  createdAt: repository.createdAt,
  updatedAt: repository.updatedAt,
  url: repository.url,
  popularity: repository.stargazerCount,
  cbo: repository.metricsCk.cbo,
  dit: repository.metricsCk.dit,
  lcom: repository.metricsCk.lcom,
  loc: repository.metricsCk.loc,
  compositeScore : repository.compositeScore
});

export const requisito3Mapper = (
  repository: RepositoryEntity,
): Requisito3ResponseDto => ({
  name: repository.name,
  owner: repository.owner,
  primaryLanguage: repository.primaryLanguage,
  createdAt: repository.createdAt,
  updatedAt: repository.updatedAt,
  url: repository.url,
  allReleasesCount: repository.allReleasesCount,
  cbo: repository.metricsCk.cbo,
  dit: repository.metricsCk.dit,
  lcom: repository.metricsCk.lcom,
  loc: repository.metricsCk.loc,
  compositeScore : repository.compositeScore
});

export const requisito4Mapper = (
  repository: RepositoryEntity,
): Requisito1ResponseDto => ({
  name: repository.name,
  owner: repository.owner,
  primaryLanguage: repository.primaryLanguage,
  createdAt: repository.createdAt,
  updatedAt: repository.updatedAt,
  url: repository.url,
  popularity: repository.stargazerCount,
  cbo: repository.metricsCk.cbo,
  dit: repository.metricsCk.dit,
  lcom: repository.metricsCk.lcom,
  loc: repository.metricsCk.loc,
  compositeScore : repository.compositeScore
});
