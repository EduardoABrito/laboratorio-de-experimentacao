import { RepositoryEntity } from './entities/repository.entity';
import { Requisito1 } from './requisitos/requisito-1';
import { Requisito2 } from './requisitos/requisito-2';
import { Requisito3 } from './requisitos/requisito-3';
import { Requisito4 } from './requisitos/requisito-4';
import { GitService } from './service/git.service';

const requisito1Init = async (repositories: RepositoryEntity[]) => {
  const requisito = new Requisito1(repositories);

  await requisito.execute();
  await requisito.saveCsv();
  await requisito.saveChart();

  requisito.toStringResult();
};

const requisito2Init = async (repositories: RepositoryEntity[]) => {
  const requisito = new Requisito2(repositories);

  await requisito.execute();
  await requisito.saveCsv();
  await requisito.saveChart();

  requisito.toStringResult();
};

const requisito3Init = async (repositories: RepositoryEntity[]) => {
  const requisito = new Requisito3(repositories);

  await requisito.execute();
  await requisito.saveCsv();
  await requisito.saveChart();

  requisito.toStringResult();
};

const requisito4Init = async (repositories: RepositoryEntity[]) => {
  const requisito = new Requisito4(repositories);

  await requisito.execute();
  await requisito.saveCsv();
  await requisito.saveChart();

  requisito.toStringResult();
};

const init = async () => {
  const gitService = new GitService();
  const repositories = await gitService.getRepositories(1000);

  await requisito1Init(repositories);
  await requisito2Init(repositories);
  await requisito3Init(repositories);
  await requisito4Init(repositories);
};

init();
