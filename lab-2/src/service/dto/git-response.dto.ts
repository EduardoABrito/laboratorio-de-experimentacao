export class RepositoryGitResponseDto {
  name: string;
  owner: { login: string };
  primaryLanguage: { name: string };
  stargazerCount: number;
  createdAt: Date;
  updatedAt: Date;
  pullRequests: { totalCount: number };
  mergedPullRequests: { totalCount: number };
  issues: { totalCount: number };
  closedIssues: { totalCount: number };
  releases: { totalCount: number };
  url: string;
  compositeScore : number;
}
export class FindRepositoriesGitResponseDto {
  repositories: RepositoryGitResponseDto[];
  cursor: string;
}
