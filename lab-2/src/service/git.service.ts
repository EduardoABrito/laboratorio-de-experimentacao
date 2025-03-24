import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

import { RepositoryEntity } from '../entities/repository.entity';
import { progressBarStep } from '../utils/progress-bar.util';
import {
  FindRepositoriesGitResponseDto,
  RepositoryGitResponseDto,
} from './dto/git-response.dto';
export class GitService {
  static GIT_GRAPHQL_URL = process.env.GIT_BASE_URL;
  static GIT_AUTH_TOKEN = process.env.GIT_AUTH_TOKEN;
  private static QUANTITY_PERMITED_SEARCH_REPOSITORIES_BY_REQ = 20;
  private static CLONE_DIR = path.join(__dirname, '../../clone_repositories');
  private simpleGit: SimpleGit;

  constructor() {
    this.simpleGit = simpleGit();
  }

  private async sendRequest(query: any, variables: any): Promise<any> {
    const { request } = await import('graphql-request');

    return await request({
      url: GitService.GIT_GRAPHQL_URL,
      document: query,
      variables,
      requestHeaders: {
        Authorization: `Bearer ${GitService.GIT_AUTH_TOKEN}`,
        'User-Agent': 'GraphQL-Client',
      },
    });
  }

  private async findRepositoriesInGithub(
    skip: number,
  ): Promise<FindRepositoriesGitResponseDto> {
    const { gql } = await import('graphql-request');

    const variables = {
      perPage: GitService.QUANTITY_PERMITED_SEARCH_REPOSITORIES_BY_REQ,
      skip,
    };

    const query = gql`
      query ($perPage: Int!, $skip: String) {
        search(
          query: "language:Java sort:stars-desc"
          type: REPOSITORY
          first: $perPage
          after: $skip
        ) {
          edges {
            node {
              ... on Repository {
                name
                owner {
                  login
                }
                primaryLanguage {
                  name
                }
                stargazerCount
                createdAt
                updatedAt
                pullRequests {
                  totalCount
                }
                mergedPullRequests: pullRequests(states: MERGED) {
                  totalCount
                }
                issues {
                  totalCount
                }
                closedIssues: issues(states: [CLOSED]) {
                  totalCount
                }
                releases {
                  totalCount
                }
                url
              }
            }
            cursor
          }
        }
      }
    `;

    const { search: result } = await this.sendRequest(query, variables);

    return {
      repositories: result.edges.map((edge: any) => edge.node),
      cursor: result.edges.length > 0 ? result.edges.at(-1).cursor : null,
    };
  }

  async getRepositories(quantity: number): Promise<RepositoryEntity[]> {
    const listRepositories: RepositoryGitResponseDto[] = [];
    let cursorAux = null;
    console.log(`Carregando repositórios`);

    while (listRepositories.length < quantity) {
      progressBarStep(listRepositories.length, quantity);
      const missingAmount = quantity - listRepositories.length;

      try {
        const { repositories, cursor } =
          await this.findRepositoriesInGithub(cursorAux);

        if (!repositories || repositories.length === 0) {
          break;
        }

        const addRepositories = repositories.slice(0, missingAmount);
        listRepositories.push(...addRepositories);
        cursorAux = cursor;

        if (!cursorAux) {
          break;
        }
      } catch (error) {
        console.error(`Erro : ${error.message}`);
        console.error(error.stack);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    progressBarStep(listRepositories.length, quantity);
    return this.createEntites(listRepositories);
  }

  private async createEntites(
    listRepositories: RepositoryGitResponseDto[],
  ): Promise<RepositoryEntity[]> {
    const entities = [];

    console.log(`\nCarregando entidades`);
    progressBarStep(entities.length, listRepositories.length);

    for (const repository of listRepositories) {
      const entity = await RepositoryEntity.create({
        name: repository.name,
        owner: repository.owner.login,
        primaryLanguage: repository.primaryLanguage.name,
        stargazerCount: repository.stargazerCount,
        createdAt: repository.createdAt,
        updatedAt: repository.updatedAt,
        url: repository.url,
        compositeScore: repository.compositeScore,
        allReleasesCount: repository.releases.totalCount,
      });

      entities.push(entity);
      progressBarStep(entities.length, listRepositories.length);
    }

    return entities;
  }

  async cloneRepository(url: string, name: string): Promise<string> {
    fs.ensureDirSync(GitService.CLONE_DIR); // Garante que o diretório de clones exista

    const repoPath = path.join(GitService.CLONE_DIR, name);

    // Verifica se o repositório já foi clonado
    if (fs.existsSync(repoPath)) {
      // Verifica se o diretório contém um repositório Git válido
      const gitDir = path.join(repoPath, '.git');
      if (fs.existsSync(gitDir)) {
        console.log(`Repositório já clonado: ${repoPath}`);
        return repoPath; // Já existe um repositório válido
      } else {
        // Se o diretório não contém um repositório válido, exclui e clona novamente
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
    }

    try {
      // Tenta clonar o repositório
      await this.simpleGit.clone(url, repoPath);
      console.log(`Clonando repositorio: ${repoPath}`);
      return repoPath; // Retorna o caminho do repositório clonado
    } catch (e) {
      console.error(`Erro ao clonar o repositório: ${e.message}`);
      return null; // Retorna null em caso de erro
    }
  }
}
